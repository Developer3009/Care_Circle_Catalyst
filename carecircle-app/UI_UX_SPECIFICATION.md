# CareCircle: UI/UX Specification & Master Frontend Design Prompt

> Use this comprehensive specification to build or refactor the CareCircle frontend from scratch. It is engineered specifically around the hackathon problem statement: **Elder at the centre**, **collaborative multi-role care circle**, **proactive escalation**, and **accessible, mistake-proof interactions**.

---

## 1. UX Design Philosophy & Core Principles

1. **Dual-Persona Interface**:
   - **Elder Mode (Default for Seniors)**: Maximum contrast (WCAG AAA), oversized interactive buttons (minimum 64px touch target), large 20px–28px typography, no complex nested menus, single-tap confirmation with haptic/audio feedback, and a built-in voice reader.
   - **Circle Caregiver Mode**: Rich clinical dashboard for caretakers, children, and doctors featuring schedule builders, vitals charts, stock refill meters, and audit trails.
2. **Mistake-Proof Interactions**:
   - Every "Taken" dose action offers a **5-minute undo toast** to prevent accidental clicks.
   - Destructive or sensitive actions (passcode rotation, removing a member, changing critical prescriptions) require step-up confirmation or Elder PIN.
3. **Escalation Visibility**:
   - Color-coded severity states (`Green = Taken`, `Amber = Pending / Within Grace Period`, `Red = Missed / Escalated`).
   - Clear escalation ladder markers indicating whether Caretaker (L1) or Family (L2) has been notified.

---

## 2. Design System & Theme Tokens

- **Primary Brand (Calm & Trustworthy)**:
  - Deep Emerald: `#065F46` (Tailwind `emerald-800`) — Primary header, key actions
  - Soft Mint: `#D1FAE5` (Tailwind `emerald-100`) — Success backgrounds, badge pills
- **Elder Contrast Accent**:
  - Warm Amber Gold: `#F59E0B` (Tailwind `amber-500`) — High-visibility highlights, audio icons
  - Warm Cream Surface: `#FFFBEB` (Tailwind `amber-50/50`) — Softer on senior eyes than harsh pure white
- **Emergency / Critical Alert**:
  - Crimson / Rose: `#E11D48` (Tailwind `rose-600`) — SOS Card, missed doses, drug interactions
- **Typography**:
  - Primary font: Inter / Plus Jakarta Sans (ultra-clean sans-serif).
  - Elder Mode minimum font sizes:
    - Headers: 28px – 34px (bold/extrabold)
    - Body text: 18px – 22px
    - Button text: 20px (bold)
    - Time labels: 20px (monospace font like JetBrains Mono for legibility)

---

## 3. Screen-by-Screen UI/UX Specifications

### Screen 1: Top Navigation & Elder Bar
- **Header**:
  - Left: Logo icon + "CareCircle" + Circle switcher dropdown ("Dad's Health Circle").
  - Center: Live status badge ("Connected to Supabase").
  - Right:
    - **SOS Emergency Card** button (high-visibility rose pill).
    - **Elder Mode Toggle** (switches between standard dashboard and extra-large accessibility mode).
    - **Voice Assistant button**: Reads aloud today's upcoming medication in English/Hindi via Web Speech API.
- **Sub-Navigation Bar (Horizontal Scrollable Tabs)**:
  1. `Today's Doses` (Pill icon)
  2. `Medications & Stock` (Shield / Prescription icon)
  3. `Consent & Circle` (Family/Users icon + pending badge indicator)
  4. `Health Vitals` (Heartbeat/Activity icon)
  5. `Doctor Visits` (Calendar icon)

---

### Screen 2: Today's Medication Timeline (The Core Flow)
- **Top Summary Card**:
  - Circular adherence progress ring (e.g., `85% Today`).
  - Greeting: "Good Morning, Ramesh ji! 2 of 4 medicines taken today."
  - Passcode chip showing active circle passcode (`CARE789`).
- **Dose Cards (Vertical Stack sorted chronologically)**:
  - Each card represents one dose event:
    - **Time Badge**: Large monospace time (`08:30 AM`) with morning/afternoon/night icon.
    - **Medicine Details**: Large bold title (`Metformin Hydrochloride 500mg`), instruction chip (`After breakfast`).
    - **Status State**:
      - *Scheduled*: Displays an oversized, vibrant green **"Mark as Taken"** button (60px high, thumb-friendly).
      - *Taken*: Card turns light mint green with a checkmark badge (`Taken at 8:35 AM by Ramesh`) and a subtle `Undo` link.
      - *Missed*: Card turns soft rose/amber with an alert badge: `Missed • Escalated to Sunita (Caretaker)`.

---

### Screen 3: Medications & Stock Refill Tracker
- **Two-Column Card Grid**:
  - Medication name, generic name, dosage, and food instructions.
  - **Stock Countdown Pill Counter**:
    - Displays remaining pill count in bold numbers (e.g., `14 pills remaining`).
    - When count is $\le$ 5 days: Displays a pulsating red/amber badge: `⚠️ Refill Needed! Caretaker alerted`.
  - Floating or header button: **"+ Add New Medication"** modal with fields for name, dosage, timing slots, and stock count.

---

### Screen 4: Consent Center & Passcode Management (Problem Statement Requirement)
- **Passcode Share Banner**:
  - Displays the current 8-character hashed passcode (`CARE789`) with an expiration timer (`Expires in 42 hours`).
  - Quick action: **"Rotate Passcode"** (generates fresh code immediately).
  - Copy invite link button.
- **Pending Member Approvals (Elder Ownership)**:
  - List of people who entered the passcode:
    - Example: *Dr. K. Nair (`dr.nair@hospital.org`) requested DOCTOR_VIEWER access*.
    - Two clear action buttons: **"Approve Access"** (Green) and **"Decline"** (Gray).
  - Table of active members with role tags (`ELDER_OWNER`, `CARETAKER`, `FAMILY`, `DOCTOR_VIEWER`).
- **Audit & Notification Trail**:
  - Feed of recent events:
    - *"Morning Metformin marked Taken on time"*
    - *"Dr. Nair requested access"*
    - *"Calcium & D3 reached low stock threshold"*.

---

### Screen 5: Health Vitals Tracker
- **Metrics Grid (Cards for BP, Sugar, Pulse, Weight)**:
  - Displays latest reading in giant bold typography (e.g., `124/82 mmHg`, `118 mg/dL`).
  - Normal / Elevated / Critical range status pill.
  - "+ Log Reading" modal allowing simple numerical entry.

---

### Screen 6: SOS Emergency Card (`/emergency`)
- **Clean, Public-Accessible Medical Card**:
  - Designed for first responders or hospital triage.
  - Large red header: `EMERGENCY MEDICAL CARD`.
  - Full name, Age, Blood Group (`O+ Positive`) highlighted prominently.
  - Known Drug Allergies (`Penicillin, Sulfa`) in warning boxes.
  - **One-Tap Dialing Buttons**:
    - `Call Caretaker: +91 98765 43210`
    - `Call Daughter: +91 98111 22334`
    - `Call Cardiologist: +91 98222 33445`
  - Print Card button (`window.print()` formatted for wallet sizing).

---

### Screen 7: Signed One-Tap Email Action (`/e/:token`)
- **Zero-Login Quick Confirmation**:
  - Clean centered card for mobile screens.
  - When elder or caretaker clicks "I have taken this medicine" inside their email reminder, this page validates the single-use token, marks the dose `TAKEN` in Supabase, and shows a celebratory checkmark with a link to open the app.

---

## 4. Master Frontend AI Prompt (Copy & Paste to Any AI/Frontend Tool)

```text
You are an expert Principal Frontend & UX Engineer. Build the complete, production-ready frontend for "CareCircle" — an Elder-Centric Collaborative Healthcare and Medication Management platform built with Next.js 14+ (App Router), Tailwind CSS, and Lucide React.

### Core Philosophy:
1. "Elder at the Center": Seniors have deteriorating eyesight and motor skills. Provide a toggleable "Elder Mode" with extra-large typography (20px+ body), high-contrast borders, oversized touch targets (min 56px height), and Web Speech API text-to-speech reading.
2. "Shared Care Circle": A senior owns the circle. Caregivers and family join using an expiring passcode, but can only see data once the Elder approves them in the Consent Center.
3. "Proactive Escalation": Medications have statuses (SCHEDULED, TAKEN, MISSED). Missing a dose escalates to Caregiver (Level 1) and Family (Level 2).

### Required Views & Components:
1. Top Navigation Bar:
   - App branding with Heart icon and live Circle selector ("Dad's Health Circle").
   - "SOS Emergency Card" button linking to /emergency.
   - "Elder Mode" toggle switch (High contrast, large font).
   - "Voice Assistant" button that reads the next scheduled dose aloud using window.speechSynthesis.
   - Tabs: "Today's Doses", "Medications & Stock", "Consent & Circle", "Health Vitals", "Doctor Visits".

2. Today's Doses Screen:
   - Adherence progress indicator (% of daily doses taken).
   - Chronological list of dose cards with time badges, medicine names, instructions ("After food"), and a giant, thumb-friendly "Mark as Taken" button.
   - Taken cards transition to a calm green with logged timestamp and an "Undo" option.

3. Medications & Inventory Screen:
   - Grid of active prescriptions with criticality tags (NORMAL, HIGH, CRITICAL).
   - Live stock count with automatic warning badges when pills are <= 5.
   - "Add Medication" modal with name, dosage, frequency, and time slots.

4. Consent Center & Circle Members Screen:
   - Circle passcode display (e.g. "CARE789") with a "Rotate Passcode" button and countdown timer.
   - Pending member approval list where the Elder can click "Approve Access" or "Reject".
   - Role badges for members: ELDER_OWNER (Gold), CARETAKER (Blue), FAMILY (Purple), DOCTOR_VIEWER (Slate).
   - Activity/Notification feed displaying recent dose confirmations, refill alerts, and escalations.

5. Health Vitals Screen:
   - Cards for Blood Pressure, Blood Sugar, and Heart Rate with safe range indicators and a "Log Reading" modal.

6. SOS Emergency Card Page (/emergency):
   - Red emergency banner with Blood Group, age, and prominent Allergy warning pills.
   - Direct clickable "tel:" phone buttons for Caretaker, Family, and Doctor.
   - "Print Card" and "Share Link" buttons.

7. Signed One-Tap Email Action Page (/e/[token]):
   - Single-use zero-login confirmation page acknowledging doses clicked directly from email notifications.

Ensure full responsiveness, zero TypeScript errors, clean modular components, accessible ARIA attributes, and smooth transitions.
```
