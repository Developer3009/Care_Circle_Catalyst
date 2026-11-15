# Care_Circle_Catalyst

# CareCircle: Elderly Care & Medication Management Platform

CareCircle is an elder-centric collaborative healthcare management ecosystem that keeps elderly individuals at the heart of their care while empowering families, caregivers, and doctors with proactive visibility and timely interventions.

---

## 🏗️ Architecture & System Design Documentation

Complete architectural details, Mermaid diagrams, sequence flows, ERDs, security specifications, and project layout are documented in:
👉 [ARCHITECTURE.md](file:///c:/Projects/CareCircle/ARCHITECTURE.md)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x
- Docker & Docker Compose (for PostgreSQL & Redis)

### 2. Infrastructure Setup
```bash
docker compose up -d
```
This spins up:
- **PostgreSQL 16**: `localhost:5432` (`carecircle` / `carecircle_secret`)
- **Redis 7**: `localhost:6379`

### 3. Monorepo Organization
```
carecircle/
├── apps/
│   ├── web/        # Next.js 14+ PWA Frontend (App Router, Tailwind, shadcn/ui)
│   └── api/        # NestJS REST API & BullMQ Scheduler Engine
├── packages/
│   ├── shared/     # Shared Zod validation schemas, TypeScript contracts & types
│   └── tsconfig/   # Base TypeScript configurations
├── docker-compose.yml
└── ARCHITECTURE.md
```

---

## 🛡️ Core Architectural Tenets
1. **Elder Autonomy**: The elderly individual is the circle owner (`ELDER_OWNER`). Access requires passcode verification followed by explicit Elder approval in the **Consent Center**.
2. **Escalation Ladder**: Missed dose events automatically cascade from Level 0 (Elder) to Level 1 (Caregiver after +15m) and Level 2 (Family after +45m).
3. **One-Tap Tokenized Actions**: Reminder emails embed secure, single-use, 2-hour signed tokens (`GET /e/:token`) allowing instant logging of `Taken` / `Snooze` / `Skip` without login.
4. **Multitenant Scope & IDOR Protection**: Every database query is strictly scoped by `:circleId` and verified via NestJS `AuthGuard` -> `CircleMemberGuard` -> `PermissionPolicyGuard`.
