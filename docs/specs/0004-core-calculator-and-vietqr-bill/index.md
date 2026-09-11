# 0004. Core calculator and VietQR bill

**Date**: 2026-09-10
**Status**: Accepted

## Summary

This specification establishes the core calculation engine and VietQR payment card generator for Host Badminton. The system provides real time client side calculations across diverse badminton cost scenarios, including even splits, female discounts, fixed gender fees, and two stage early leaver splits, with per player fees rounded up to the nearest thousand Dong. It renders a shareable VietQR payment bill card with instant formatted text copying for Zalo and Messenger, PNG image export, and backend persistence via FastAPI.

## Requirements

**User stories**:
- As a badminton host on court, I want to enter court fees and shuttlecock counts and see instant per player fee splits so that I can announce payment amounts immediately when the game ends.
- As a host with female players receiving social discounts, I want to apply a fixed discount or fixed fee for female players and have male players absorb the remainder evenly.
- As a host with players leaving after the first hour, I want to calculate a two stage split where early leavers pay only for stage one court time and used shuttlecocks, while stayers split both stages.
- As a host collecting payments, I want to generate a VietQR bill card prefilled with my bank account and exact transfer amount so that members can scan and pay in seconds without typing numbers.
- As a host sharing the bill to Zalo or Messenger, I want a one tap button to copy a formatted text summary and download a clean PNG image of the bill card.
- As a host switching between apps, I want my bank account details and draft session inputs saved automatically in local storage so that I never lose entered numbers if the page reloads.

**Acceptance criteria**:
- **AC-1**: Pure calculation engine implements even split, fixed female discount, fixed male/female fee, and time proportional two stage early leaver formulas, rounding per player amounts up to the nearest 1.000 VND.
- **AC-2**: Mobile calculator interface provides touch friendly inputs for court fee, shuttlecock quantity and unit price, male and female player counters, and early leaver stage controls with real time reactive recalculation.
- **AC-3**: Bank profile management supports selecting major Vietnamese banks (via standard BIN bank codes), entering account number, account holder name, and custom memo template.
- **AC-4**: Local storage auto save restores host bank profile and session parameters automatically on page load or refresh.
- **AC-5**: Shareable VietQR bill card renders a sport dark card preview containing court venue info, session date and time, cost breakdown, player splits, and a scan ready VietQR code generated via the VietQR Quicklink gateway with local fallback.
- **AC-6**: One tap text summary button copies an emoji formatted breakdown to clipboard with toast notification, ready to paste into Zalo and Messenger groups.
- **AC-7**: PNG image export generates a downloadable high contrast 4:5 bill card graphic using client side canvas rendering.
- **AC-8**: FastAPI backend service in `backend/app/api/v1/endpoints/sessions.py` provides calculation verification and session record persistence backed by PostgreSQL.

## Decision

**Chosen option**: Option 1: Hybrid Client Calculation with Backend Persistence.

We implement an instant client side calculation engine with VietQR Quicklink generation, backed by a FastAPI verification and session persistence API.

## Rationale

See [rationale.md](rationale.md) for full context and options evaluated.

## Feature design

### Calculation Formulas & Mathematical Model

Let $C$ be total court fee, $S$ be total shuttlecock fee ($Q_{shuttle} \times P_{shuttle}$), and $E = C + S$ be total expenses.
Let $N_m$ be male count, $N_f$ be female count, and $N_{total} = N_m + N_f$.

**1. Even Split Mode (`even`)**:
$$\text{Raw per person} = \frac{E}{N_{total}}$$
$$\text{Fee}_{male} = \text{Fee}_{female} = \lceil \frac{\text{Raw}}{1000} \rceil \times 1000$$

**2. Female Discount Mode (`fixed_female_discount`, e.g. discount $D = 10.000$ VND)**:
$$\text{Base per person} = \frac{E - (N_f \times D)}{N_{total}}$$
$$\text{Fee}_{female} = \max(0, \lceil \frac{\text{Base}}{1000} \rceil \times 1000)$$
$$\text{Fee}_{male} = \text{Fee}_{female} + D$$

**3. Fixed Female Fee Mode (`fixed_female`, e.g. fixed fee $F_f = 30.000$ VND)**:
$$\text{Fee}_{female} = F_f$$
$$\text{Fee}_{male} = \begin{cases} 
\lceil \frac{E - (N_f \times F_f)}{N_m \times 1000} \rceil \times 1000 & \text{if } N_m > 0 \\
F_f & \text{if } N_m = 0 
\end{cases}$$

**4. Two Stage Early Leaver Mode (`multi_stage`)**:
Let stage 1 represent fraction $r_1$ of court time (e.g. $r_1 = 0.5$ for 1 hour of a 2 hour session) and $S_1$ shuttlecocks used in stage 1.
$$\text{Cost}_{stage1} = (C \times r_1) + S_1$$
$$\text{Cost}_{stage2} = E - \text{Cost}_{stage1}$$
Let $N_{early}$ be early leaver count and $N_{stay}$ be stayer count ($N_{total} = N_{early} + N_{stay}$).
$$\text{Fee}_{early} = \lceil \frac{\text{Cost}_{stage1}}{N_{total} \times 1000} \rceil \times 1000$$
$$\text{Fee}_{stay} = \text{Fee}_{early} + \lceil \frac{\text{Cost}_{stage2}}{N_{stay} \times 1000} \rceil \times 1000$$

### VietQR Quicklink Specification

VietQR images are generated using standard VietQR Quicklink URL schema:
```
https://img.vietqr.io/image/{bank_bin}-{account_number}-{template}.png?amount={amount}&addInfo={encoded_memo}&accountName={encoded_name}
```
- `bank_bin`: 6 digit State Bank of Vietnam BIN (e.g. `970422` for MB Bank, `970436` for Vietcombank, `970407` for Techcombank).
- `template`: `compact2` or `qr_only`.
- `amount`: Calculated session fee or total bill amount.
- `addInfo`: URL encoded transfer description (e.g. `SAN KY HOA 10 09`).
- `accountName`: URL encoded account holder name.

### API Surface

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/sessions/calculate` | POST | `court_fee`, `shuttle_fee`, `male_count`, `female_count`, `split_mode`, `discount`, `early_leavers` | `male_fee`, `female_fee`, `early_fee`, `total_expenses`, `total_collected` | Public | 422 Invalid parameters |
| `/api/v1/sessions` | POST | `SessionCreate` payload (expenses, participants, bank details) | `SessionDetailResponse` | Optional / Bearer | 400 Bad request, 422 Invalid payload |
| `/api/v1/banks` | GET | None | List of major Vietnam banks (`bin`, `shortName`, `name`, `logo`) | Public | 500 External failure |

### Value Sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Calculate male and female fees | Computed numeric VND fees | Derived via `calculateSessionSplit()` formula helper |
| Calculate early leaver share | Computed stage 1 fee share | Derived via two stage formula from court time and shuttles |
| Display VietQR payment code | Scan ready QR image URL | Formatted VietQR Quicklink URL with host bank BIN and STK |
| Populate bank choices | Bank names and BIN codes | Static Vietnam bank catalog in `src/lib/banks.ts` |
| Restore previous session | Pre filled inputs and bank details | Browser `localStorage` key `host_badminton_calculator_state` |
| Download bill image | 4:5 PNG graphic file | Client side HTML canvas capture via `html-to-image` |

### Key Invariants

- Total participants ($N_m + N_f$) must be at least 1 for calculations to run; 0 participants displays 0 fees without dividing by zero.
- All calculated per player fee results must be rounded up to the nearest 1.000 VND multiple.
- Total collected amount ($\sum \text{Player Fees}$) must be greater than or equal to total expenses ($E$), with positive excess acting as court fund buffer.
- Host bank account numbers must be stripped of spaces and hyphens before injecting into VietQR URLs.

### Security Model

Calculations execute locally in the client browser with zero privileged access. Session saving endpoints accept optional authentication, allowing unauthenticated anonymous guest sessions during MVP while binding records to host user UUID when authenticated.

### Configuration Required

- `VITE_VIETQR_GATEWAY_URL`: Optional custom VietQR image gateway (defaults to `https://img.vietqr.io/image`).

### Critical Test Scenarios

- Happy path even split: 200.000 VND court + 160.000 VND shuttle (8 shuttles at 20.000 VND) across 6 males and 4 females yields exactly 36.000 VND per person (verifies AC-1, AC-2).
- Female discount split: 360.000 VND total with 6 males, 4 females, and 10.000 VND female discount yields 40.000 VND for males and 30.000 VND for females (verifies AC-1, AC-2).
- Two stage early leavers: 2 hour court (200k) where 2 early leavers play 1 hour and use 4 of 8 shuttles yields 18.000 VND for early leavers and 41.000 VND for stayers (verifies AC-1).
- VietQR Quicklink rendering: Valid bank BIN and account number formats accurate image URL with correct amount and memo (verifies AC-3, AC-5).
- Local storage persistence: Reloading the page retains entered court fee, player counts, and host banking credentials (verifies AC-4).
- Text copy and PNG export: One tap copy produces complete formatted text, and PNG export triggers valid image file download (verifies AC-6, AC-7).
- Backend verification: POST `/api/v1/sessions/calculate` returns matching fee calculations and validation codes (verifies AC-8).

## Build plan

- [x] 1. Create pure calculation engine in `frontend/src/lib/calculator.ts` with comprehensive unit tests for even split, gender discount, fixed fee, and two stage early leavers, satisfies **AC-1**
- [x] 2. Create Vietnam bank directory and VietQR URL builder utility in `frontend/src/lib/vietqr.ts`, satisfies **AC-3**, **AC-5**
- [x] 3. Create local storage persistence manager in `frontend/src/lib/storage.ts` to save and restore calculator parameters and bank profile, satisfies **AC-4**
- [x] 4. Build interactive calculator components in `frontend/src/components/calculator/` (CourtFeeSection, ShuttlecockSection, PlayerCountSection, SplitModeTabs, EarlyLeaverDrawer), satisfies **AC-2**
- [x] 5. Enhance `BillCardPreview` with dynamic VietQR generation, bank selector modal, copy text template, and PNG canvas export via `html-to-image`, satisfies **AC-5**, **AC-6**, **AC-7**
- [x] 6. Build FastAPI calculation endpoint and session persistence API in `backend/app/api/routes/sessions.py` and `backend/app/services/calculator.py`, satisfies **AC-8**
- [x] 7. Integrate calculator into `frontend/src/App.tsx` and verify complete end to end workflow, satisfies **AC-2**, **AC-5**

## Consequences

**Positive**:
- Lightning fast calculation on court with instant feedback on mobile phones.
- Robust offline operation in sports centers with spotty connectivity.
- Effortless payment collection for hosts with automated VietQR code generation.
- Clear split transparency for players via Zalo and Messenger message sharing.

**Negative / tradeoffs**:
- Calculation formulas exist in both TypeScript and Python; test suites must guarantee parity.
- VietQR image rendering relies on VietQR Quicklink gateway with fallback to offline Canvas QR generator.

**Neutral**:
- Requires `html-to-image` dependency in frontend for PNG image generation.

## Follow-up

- [x] Install `html-to-image` in `frontend/package.json` for PNG bill card export.
- [x] Run `/develop core calculator & VietQR bill` to build the calculation engine, VietQR generator, and API endpoints.
