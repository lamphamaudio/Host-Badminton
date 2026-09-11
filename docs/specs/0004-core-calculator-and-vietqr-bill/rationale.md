# 0004. Core calculator and VietQR bill: Rationale

## Context

Badminton court organizers in Vietnam manage sessions with dynamic operational complexities: variable court durations, fluctuating shuttlecock usage, uneven gender pricing conventions, and players who leave early after the first hour. Calculating individual fee shares on court using standard calculator apps is slow, error prone, and often leads to disputes or unpaid debts.

Furthermore, once costs are split, hosts must collect payments from 6 to 16 players simultaneously. Manually typing bank account numbers and transfer amounts into chat groups results in delayed payments and host frustration. 

The Host Badminton calculator must deliver immediate reactive calculations directly on mobile web without network delays, while producing an unambiguous VietQR payment bill card that players can scan directly from their banking apps.

## Options considered

### Option 1: Hybrid Client Calculation with Backend Persistence (Chosen)

This option implements real time reactive calculation logic in TypeScript on the frontend for instant mobile UI updates, paired with a matching calculation engine and session persistence API in FastAPI.

**Pros**:
- Zero latency calculation feedback on mobile web directly on court.
- Complete offline resilience: calculations and VietQR generation work even with unstable court WiFi or 4G.
- Full backend validation and database storage when host chooses to save history.

**Cons**:
- Requires maintaining matching calculation formulas in both TypeScript (`frontend/src/lib/calculator.ts`) and Python (`backend/app/services/calculator.py`).

### Option 2: Pure Backend Calculation via REST API

This option delegates all calculation formulas exclusively to the FastAPI backend service, making API requests whenever inputs change.

**Pros**:
- Single authoritative formula implementation in Python.

**Cons**:
- Network latency creates lag when hosts rapidly tap stepper buttons or money chips.
- Total failure when mobile connection drops inside underground sports halls.

### Option 3: Pure Client Side Local App without Backend

This option implements the calculator solely as a client side Single Page Application with no backend API persistence.

**Pros**:
- Simple architecture with zero server requirements for Slice 1.

**Cons**:
- Prevents multi device synchronization, historical session analytics, and member debt tracking in future slices.

## Rationale

Court organizers need instant, tactile response when tapping stepper counters and currency chips directly on court. Waiting for backend API round trips on poor sports hall connectivity would degrade user experience. By implementing the core calculation engine in TypeScript with local storage auto restore, the host enjoys lightning fast feedback, while the FastAPI backend provides authoritative validation and persistent storage for historical logs and member debt tracking.
