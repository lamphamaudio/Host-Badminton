# Scope: Host Badminton

A web application dedicated to badminton hosts to quickly calculate session splits, generate VietQR payment cards, manage courts, and track member debts.

**Build approach:** Skateboard (ship the thinnest usable whole first, then grow it).
**Workflow:** Beta (check verify then test). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | done |
| 2 | Coding standards & tooling | Foundation | done |
| 3 | Data model | Foundation | done |
| 4 | Design system & UI foundation | Foundation | done |
| 5 | Core calculator & VietQR bill | Slice 1 | done |
| 6 | Court and session management | Slice 2 | done |
| 7 | Host authentication | Slice 3 | done |
| 8 | Members and debt tracking | Slice 4 | done |

## Foundations

### 1. Stack & architecture · done
Decide the technology stack and scaffold a runnable project so every later slice builds on real structure.
**Done when:** the stack is recorded in an architecture spec and the scaffold boots locally and passes build clean.
- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
- [x] Smoke-check it runs: `/test`
Spec [0001](../specs/0001-stack-and-architecture.md) · code in `./`

### 2. Coding standards & tooling · done
Capture project conventions into root AGENTS.md, then install lint, format, and pre commit tooling from the real scaffolded project.
**Done when:** root AGENTS.md reflects the real stack, and lint, format, and pre commit run clean.
- [x] Capture conventions + tooling choices: `/audit`
- [x] Install the tooling: `/develop tooling`
- [x] Check it runs clean: `/test`

### 3. Data model · done
Core database entities and schema for hosts, courts, sessions, participants, cost items, and payment statuses.
**Done when:** schema and relational constraints support session persistence, multi stage cost splits, and debt tracking without breaking migrations later.
- [x] Design it (spec): `/architect data model`
- [x] Build it: `/develop data model`
  - [x] UUID v7 helper and SQLAlchemy 2.0 declarative models (AC-1 through AC-8)
  - [x] Alembic migration setup and initial migration script (AC-8)
  - [x] Pydantic v2 schemas and validation contracts (AC-1 through AC-7)
- [x] Verify it: `/check verify data model`
- [x] Test it: `/test data model`
Spec [0002](../specs/0002-data-model/index.md) · code in `backend/app/models`, `backend/app/schemas`, `backend/alembic`

### 4. Design system & UI foundation · done
Visual language, layout primitives, and base components optimized for mobile web so hosts can operate smoothly on court.
**Done when:** design.md establishes color, typography, spacing, and mobile touch friendly base components.
- [x] Design it (spec): `/architect design system & UI foundation`
- [x] Build it: `/develop design system & UI foundation`
  - [x] Tailwind CSS v4 sport dark tokens and typography in index.css (AC-1, AC-2)
  - [x] Core input, button, money input, and stepper primitives (AC-3, AC-4)
  - [x] Card, badge, avatar, and toast primitives (AC-5, AC-8)
  - [x] Radix UI bottom sheet drawer, dialog, and tab primitives (AC-6)
  - [x] Mobile app shell with sticky header and fixed bottom navigation (AC-7)
  - [x] VietQR bill card preview container and design documentation (AC-9, AC-10)
- [x] Verify it: `/check verify design system & UI foundation`
- [x] Test it: `/test design system & UI foundation`
Spec [0003](../specs/0003-design-system-and-ui-foundation/index.md) · code in `frontend/src/components/ui`, `frontend/src/components/layout`, `frontend/src/index.css`

## Slice 1: Core calculator & VietQR bill

### 5. Core calculator & VietQR bill · done
Direct calculation engine on mobile web to split badminton session costs and generate a downloadable or shareable VietQR bill card with host banking details. Supports court fee, shuttlecock fee (total or per unit count), male and female player counts, fixed or even split rules, and early leaver stage one versus stayer stage two cost splits.
**Done when:** entering session parameters yields exact calculations across all edge cases (full male, full female, fixed gender fee, early leavers) and renders a shareable VietQR payment card ready to copy or download for Zalo and Messenger.
- [x] Design it (spec): `/architect core calculator & VietQR bill`
- [x] Build it: `/develop core calculator & VietQR bill`
  - [x] Pure calculation engine and unit tests in TypeScript and Python (AC-1)
  - [x] Vietnam bank directory and VietQR Quicklink generator with offline fallback (AC-3, AC-5)
  - [x] Local storage auto restore and session state management (AC-4)
  - [x] Mobile calculator interactive UI sections and stage controls (AC-2)
  - [x] VietQR bill card preview with text copy and PNG canvas export (AC-5, AC-6, AC-7)
  - [x] FastAPI calculation validation and session persistence API (AC-8)
- [x] Verify it: `/check verify core calculator & VietQR bill`
- [x] Test it: `/test core calculator & VietQR bill`
Spec [0004](../specs/0004-core-calculator-and-vietqr-bill/index.md) · code in `frontend/src/components/calculator`, `frontend/src/lib/calculator.ts`, `backend/app/services/calculator.py`

## Slice 2: Court and session management

### 6. Court and session management · done
Court profile management (required venue name, optional address and court number) and session history persistence.
**Done when:** a host can create court venues, browse venue listings, and save completed calculation sessions into historical logs.
- [x] Design it (spec): `/architect court and session management`
- [x] Build it: `/develop court and session management`
  - [x] Backend Venue CRUD API and database repositories (AC-1)
  - [x] Backend Session History list, filter, aggregate, and delete endpoints (AC-4, AC-5)
  - [x] Frontend Venue management UI and calculator venue quick select (AC-1, AC-2)
  - [x] Frontend Session history listing, inspection drawer, and VietQR replay (AC-3, AC-6, AC-7)
  - [x] Frontend offline queue persistence and sync (AC-8)
- [x] Verify it: `/check verify court and session management`
- [x] Test it: `/test court and session management`
Spec [0005](../specs/0005-court-and-session-management/index.md) · code in `backend/app/api/routes/venues.py`, `backend/app/api/routes/sessions.py`, `frontend/src/components/courts`, `frontend/src/components/history`


## Slice 3: Host authentication

### 7. Host authentication · done
Sign up and sign in for hosts via phone number OTP or Google OAuth to secure and synchronize data across devices.
**Done when:** hosts can authenticate with Google or phone number, and all court and session records are bound to the host profile.
- [x] Design it (spec): `/architect host authentication`
- [x] Build it: `/develop host authentication`
  - [x] Backend Auth models, tables, and JWT token utilities (AC-1, AC-2)
  - [x] Backend Google OAuth, Phone OTP, token refresh, and guest data claiming API (AC-1, AC-2, AC-3, AC-6, AC-7)
  - [x] Backend protected route query scoping by authenticated host ID (AC-4)
  - [x] Frontend AuthContext, JWT storage, and silent token refresh interceptor (AC-1, AC-2, AC-6)
  - [x] Frontend Login sheet and Settings profile & bank management UI (AC-1, AC-2, AC-5, AC-7)
- [x] Verify it: `/check verify host authentication`
- [x] Test it: `/test host authentication`
Spec [0006](../specs/0006-host-authentication/index.md) · code in `backend/app/api/routes/auth.py`, `backend/app/core/security.py`, `frontend/src/context/AuthContext.tsx`, `frontend/src/components/auth`


## Slice 4: Members and debt tracking

### 8. Members and debt tracking · done
Manage frequent player rosters, log payment confirmations, and track unpaid debts across sessions.
**Done when:** hosts can select frequent players when creating sessions, view aggregated debt summaries per member, settle debts via FIFO, and generate VietQR payment reminders.
- [x] Design it (spec): `/architect members and debt tracking`
- [x] Build it: `/develop members and debt tracking`
  - [x] Backend Member CRUD, Debt listing, and FIFO settlement API (AC-1, AC-4, AC-5, AC-7)
  - [x] Backend Session Debt creation integration (AC-3)
  - [x] Frontend Member management roster UI and detail drawer in "Thành viên" tab (AC-1, AC-4)
  - [x] Frontend Calculator member quick-pick chips (AC-2)
  - [x] Frontend Debt settlement dialog and VietQR reminder copy (AC-5, AC-6)
- [x] Verify it: `/check verify members and debt tracking`
- [x] Test it: `/test members and debt tracking`
Spec [0007](../specs/0007-members-and-debt-tracking/index.md) · code in `backend/app/api/routes/members.py`, `frontend/src/components/members`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Revive betting calculation**: calculate side bets and revive pools for session members · needs a decision
- **Automated debt reminders**: send automated reminder messages via Zalo ZNS or SMS · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` + 2 to 5 milestones; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow up enrolled |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's ## Build plan, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre workflow) and `dropped` (de scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
