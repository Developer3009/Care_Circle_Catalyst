# CareCircle: System Design & Architecture Specification

## 1. System Design Overview

CareCircle is an elder-centric healthcare management ecosystem designed to balance elderly autonomy, caregiver collaboration, and clinical reliability. The architecture follows a **Modular Monolith** pattern optimized for high velocity in a hackathon setting while maintaining clear domain boundaries that allow microservice extraction as traffic scales.

### 1.1 Architecture Highlights
- **Client Tier**: Next.js App Router (PWA) with dual-mode UX:
  - *Elder Mode*: Simplified, high-contrast, large touch-target interface with voice prompts & Web Speech TTS.
  - *Caregiver & Family Mode*: Comprehensive clinical/routine management dashboard.
- **Application & API Gateway Tier**: NestJS modular application enforcing strict layered security (`AuthGuard` -> `CircleMemberGuard` -> `PermissionPolicyGuard`).
- **Data & Ingestion Tier**: PostgreSQL with Prisma ORM, multi-tenant circle isolation via compound indexes.
- **Async Execution Tier**: Redis + BullMQ scheduler engine handling delayed dose dispatch, idempotency, retry mechanisms, and missed-dose escalation ladders.
- **External Integration Tier**:
  - Resend / Nodemailer for transactional & signed one-tap dose response emails.
  - S3 / Cloud Storage for encrypted prescription/report artifacts.
  - Drug interaction dataset/advisory engine.

---

## 2. High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients["Client Layer (PWA / Web)"]
        ElderUI["Elder UI (High-contrast, Large Touch, TTS/Voice)"]
        CaregiverUI["Caretaker & Family Dashboard"]
        DoctorUI["Doctor / Clinical View (Read-Only)"]
        EmailQuick["Email Action Client (Signed One-Tap Token)"]
    end

    subgraph Gateway["Edge & Security Layer"]
        CDN["Vercel Edge / CDN & WAF"]
        RateLimit["Rate Limiter & Brute-Force Guard"]
    end

    subgraph BackendCore["NestJS Modular Monolith API"]
        AuthModule["Auth & Identity Module\n(Argon2, JWT, Rotating Refresh)"]
        CircleModule["Circle & Consent Module\n(Passcode Hashing, Member Approvals)"]
        MedModule["Medication & Schedule Module\n(Schedules, Interaction Alerts)"]
        DoseModule["Dose Event Module\n(Logging, Stock Decrement)"]
        HealthModule["Health Log & Vitals Module\n(Threshold Alerts, Routine Tasks)"]
        ReportModule["Reporting & PDF Module\n(Adherence Analytics, Doctor Summary)"]
        AuditModule["Audit Logging Module\n(Immutable mutation logs)"]
    end

    subgraph AsyncEngine["Background Processing (Redis & BullMQ)"]
        RedisQueue[("Redis Queue Broker")]
        SchedulerWorker["Dose Event Generator (7-day Rolling)"]
        ReminderWorker["Pre-Dose & At-Dose Dispatcher"]
        EscalationWorker["Missed Dose Escalation Worker (L0 -> L1 -> L2)"]
        RefillWorker["Refill & Inactivity Monitor"]
    end

    subgraph DataStorage["Persistence & Storage Layer"]
        Postgres[("PostgreSQL\n(Prisma ORM, Circle-Scoped)")]
        S3Bucket[("Encrypted Blob Storage\n(Prescriptions, PDFs)")]
    end

    subgraph ThirdParty["External Services"]
        EmailProvider["Email Gateway (Resend / SendGrid / SMTP)"]
        DrugAPI["Drug Interaction Engine"]
    end

    Clients --> CDN
    CDN --> RateLimit
    RateLimit --> BackendCore

    BackendCore --> Postgres
    BackendCore --> RedisQueue
    BackendCore --> S3Bucket
    BackendCore --> DrugAPI

    RedisQueue --> SchedulerWorker
    RedisQueue --> ReminderWorker
    RedisQueue --> EscalationWorker
    RedisQueue --> RefillWorker

    SchedulerWorker --> Postgres
    ReminderWorker --> EmailProvider
    EscalationWorker --> EmailProvider
    RefillWorker --> EmailProvider
    EmailQuick -.->|Signed GET /e/:token| DoseModule
```

---

## 3. Core Workflow Sequence Diagrams

### 3.1 Passcode-Based Onboarding & Consent Center Flow

```mermaid
sequenceDiagram
    autonumber
    actor Elder as Elder (Circle Owner)
    actor Family as Family / Caregiver
    participant API as CareCircle API
    participant DB as PostgreSQL
    participant Email as Email Service

    Elder->>API: POST /circles/:id/passcode/generate {expiryHours: 48, maxUses: 3}
    API->>DB: Store hashed passcode & expiry
    API-->>Elder: Return plain passcode (e.g. "CARE-8492")
    
    Elder->>Family: Shares passcode out-of-band / invite link
    Family->>API: POST /circles/join {passcode: "CARE-8492", requestedRole: "FAMILY"}
    API->>DB: Validate hash & expiry, create circle_members (status: PENDING)
    API->>Email: Notify Elder of pending member join request
    API-->>Family: 202 Accepted (Pending Elder Approval)

    Elder->>API: GET /circles/:id/pending-members
    API-->>Elder: Return pending applicant details
    Elder->>API: POST /members/:memberId/approve {moduleOverrides: {...}}
    API->>DB: Update circle_members (status: ACTIVE) + create audit_logs
    API->>Email: Notify Family of approval
    API-->>Elder: Success (Member active)
```

### 3.2 Dose Generation, Reminder, and Escalation Ladder

```mermaid
sequenceDiagram
    autonumber
    participant Cron as BullMQ Scheduler
    participant DB as PostgreSQL
    participant Worker as Reminder / Escalation Worker
    participant Email as Email Gateway
    actor Elder as Elder
    actor Caregiver as Caregiver (Level 1)
    actor Family as Family (Level 2)

    Note over Cron,DB: Nightly / Schedule Update
    Cron->>DB: Generate dose_events for next 7 days in Circle Timezone (UTC stored)
    
    Note over Worker,Elder: At scheduled_at - lead_minutes (e.g., -15 min)
    Worker->>Email: Send Upcoming Dose Email with One-Tap Signed Token
    Email-->>Elder: Receives Email

    alt Elder marks dose taken
        Elder->>Email: Clicks "Mark as Taken" (GET /e/:token)
        Email->>DB: Update dose_events (status: TAKEN, logged_at: now), decrement stock
    else Elder misses dose within grace period (scheduled_at + grace_minutes)
        Worker->>DB: Check dose_events; status remains SCHEDULED past grace period
        Worker->>DB: Update dose_events (status: MISSED)
        
        Note over Worker,Caregiver: Escalation Level 1 (T + 15 min)
        Worker->>Email: Send alert to Caretaker ("Dose missed by Elder")
        Email-->>Caregiver: Alert notification

        opt Still unacknowledged at Escalation Level 2 (T + 45 min)
            Worker->>Email: Send urgent alert to Family ("Dose unconfirmed")
            Email-->>Family: Critical escalation alert
        end
    end
```

---

## 4. Database Schema & Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ CIRCLE_MEMBERS : belongs_to
    CIRCLES ||--o{ CIRCLE_MEMBERS : contains
    CIRCLES ||--|| ELDER_PROFILES : defines
    CIRCLES ||--o{ EMERGENCY_CONTACTS : has
    CIRCLES ||--o{ MEDICATIONS : prescribes
    MEDICATIONS ||--o{ MEDICATION_SCHEDULES : configures
    MEDICATIONS ||--o{ DOSE_EVENTS : generates
    MEDICATION_SCHEDULES ||--o{ DOSE_EVENTS : specifies
    DOSE_EVENTS ||--o{ EMAIL_ACTION_TOKENS : creates
    CIRCLES ||--o{ APPOINTMENTS : organizes
    CIRCLES ||--o{ VITALS : tracks
    CIRCLES ||--o{ CARE_NOTES : logs
    CIRCLES ||--o{ CHANGE_REQUESTS : requests
    CIRCLES ||--o{ AUDIT_LOGS : records
    CIRCLES ||--o{ NOTIFICATIONS : sends

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string phone
        string preferred_language
        enum platform_role "USER | ADMIN"
        datetime created_at
    }

    CIRCLES {
        uuid id PK
        uuid elder_user_id FK
        string circle_name
        string timezone
        string passcode_hash
        datetime passcode_expires_at
        int passcode_max_uses
        datetime created_at
    }

    CIRCLE_MEMBERS {
        uuid id PK
        uuid circle_id FK
        uuid user_id FK
        enum role "ELDER_OWNER | CARETAKER | FAMILY | DOCTOR_VIEWER"
        enum status "PENDING | ACTIVE | REMOVED"
        int escalation_level
        uuid approved_by
        datetime joined_at
    }

    MEDICATIONS {
        uuid id PK
        uuid circle_id FK
        string name
        string generic_name
        string strength
        string instructions "before_food | after_food | with_food"
        enum criticality "LOW | MEDIUM | HIGH | CRITICAL"
        int stock_count
        int refill_threshold_days
        boolean is_active
    }

    MEDICATION_SCHEDULES {
        uuid id PK
        uuid medication_id FK
        enum frequency_type "DAILY | SPECIFIC_DAYS | INTERVAL | AS_NEEDED"
        string[] times_of_day
        int[] days_of_week
        int grace_minutes
        int lead_minutes
    }

    DOSE_EVENTS {
        uuid id PK
        uuid medication_id FK
        uuid schedule_id FK
        uuid circle_id FK
        datetime scheduled_at
        enum status "SCHEDULED | TAKEN | MISSED | SKIPPED | SNOOZED"
        uuid logged_by
        datetime logged_at
        string source "WEB | EMAIL_LINK | CARETAKER"
    }

    AUDIT_LOGS {
        uuid id PK
        uuid circle_id FK
        uuid actor_id FK
        string action
        string entity
        uuid entity_id
        jsonb before_json
        jsonb after_json
        string ip_address
        datetime created_at
    }
```

---

## 5. Security & Access Control Architecture

### 5.1 Guard Chain Architecture
Every HTTP request to an authenticated endpoint runs through a three-stage pipeline:
1. **`AuthGuard`**: Decodes and verifies the Bearer JWT access token or checks the session cookie. Injects `req.user`.
2. **`CircleMemberGuard`**: Extracts `:circleId` from path or query params. Validates that `req.user.id` is an `ACTIVE` member of that circle. Injects `req.circleMembership`.
3. **`PermissionPolicyGuard`**: Inspects user's role + `member_permissions` granular overrides. If the action is a mutation by a `FAMILY` member on restricted entities (like `medications`), redirects to create a `change_request` instead of directly applying the mutation.

### 5.2 Tokenized Email Action Security
- Tokens are 32-byte cryptographically secure random values stored **hashed** (`sha256`) in `email_action_tokens`.
- Validity window: **2 hours**.
- Single-use: atomicity enforced with PostgreSQL transaction (`UPDATE ... WHERE used_at IS NULL RETURNING ...`).
- Scoped strictly to one `dose_event_id` and specific action (`TAKEN` / `SNOOZE` / `SKIP`).

---

## 6. Project Directory Layout (Monorepo)

```
c:\Projects\CareCircle\
├── apps/
│   ├── web/                         # Next.js 14+ PWA Client
│   │   ├── src/
│   │   │   ├── app/                 # App Router pages
│   │   │   │   ├── (auth)/          # login, register, verify, forgot
│   │   │   │   ├── (dashboard)/     # today, meds, appointments, vitals, circle
│   │   │   │   ├── e/[token]/       # Signed one-tap email action landing page
│   │   │   │   └── emergency/[id]/  # Public SOS Emergency Card page
│   │   │   ├── components/          # Elder-friendly UI components (shadcn/ui)
│   │   │   ├── hooks/               # TTS, Speech-to-text, data fetchers
│   │   │   └── lib/                 # API client, i18n dictionaries
│   │   ├── public/                  # PWA manifest, service workers, icons
│   │   └── package.json
│   │
│   └── api/                         # NestJS Backend Application
│       ├── src/
│       │   ├── auth/                # Auth, JWT, rotating refresh, argon2
│       │   ├── circles/             # Circle creation, passcode, members, consent
│       │   ├── medications/         # Med CRUD, schedule builder, drug interaction
│       │   ├── doses/               # Dose event querying, logging, email tokens
│       │   ├── appointments/        # Calendar, doctors, reminders, documents
│       │   ├── health/              # Vitals, care notes, routine tasks
│       │   ├── reports/             # Adherence computation, PDF generation
│       │   ├── jobs/                # BullMQ scheduler & workers (escalations)
│       │   ├── mail/                # Email templates & sender service
│       │   └── common/              # Guards, decorators, audit interceptor
│       ├── prisma/                  # schema.prisma, migrations, seeds
│       └── package.json
│
├── packages/
│   ├── shared/                      # Shared DTOs, Zod schemas, TypeScript types
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── circles.ts
│   │   │   ├── medications.ts
│   │   │   └── permissions.ts
│   │   └── package.json
│   └── tsconfig/                    # Shared TypeScript configs
│
├── docker-compose.yml               # PostgreSQL & Redis development services
├── pnpm-workspace.yaml              # Monorepo workspace configuration
├── package.json                     # Monorepo root scripts
└── README.md
```
