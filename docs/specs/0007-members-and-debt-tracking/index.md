# 0007. Members and debt tracking

**Date**: 2026-09-11
**Status**: Accepted

## Summary

This specification defines the member roster management and debt ledger tracking capabilities for Host Badminton. It allows organizers to manage frequent player profiles (name, phone, gender, default notes), quickly select roster members when calculating session costs, automatically log unpaid participant shares into a per-member debt ledger, track partial and full debt settlements via FIFO reconciliation, and generate copyable payment reminder messages with embedded VietQR Quicklinks for Zalo and SMS.

## Requirements

**User stories**:
- As a badminton host, I want to maintain a list of frequent players so that I do not have to type their names, genders, and phone numbers every session.
- As a host calculating a session split, I want to tap roster member chips to automatically populate participant rows and gender counts in the calculator.
- As a host saving a session, I want participants who have not paid on court to automatically convert into debt records attached to their member profiles.
- As a host, I want to view a member's total outstanding balance, historical sessions, and settlement history in a dedicated roster screen.
- As a host receiving debt payments (e.g. via bank transfer or cash), I want to record settlements that reduce the member's outstanding balance using FIFO debt allocation.
- As a host, I want to generate and copy a friendly payment reminder message with an embedded VietQR link pre-filled with the exact debt amount to send via Zalo or SMS.

**Acceptance criteria**:
- **AC-1**: Host can perform CRUD operations on roster members (create with name, phone, gender, default notes, search/filter, update, and soft deactivate).
- **AC-2**: Session calculator integrates frequent member quick pick chips and search in the participant count section, auto populating display names and gender counts.
- **AC-3**: Saving a session with unpaid participants automatically generates `DebtRecord` line items linked to the respective `Member` profiles and updates member aggregated debt balances.
- **AC-4**: Host can view member detail drawer with session attendance count, total debt balance, and chronological debt/payment ledger.
- **AC-5**: Host can record payment settlements (full balance clearance or partial payment amount) with note and timestamp, settling debt records using FIFO allocation.
- **AC-6**: Host can generate and copy a formatted debt reminder text containing player name, outstanding debt, host banking details, and dynamic VietQR Quicklink with exact debt amount.
- **AC-7**: All member and debt records are scoped strictly to the authenticated `host_id` (or guest host identifier in guest mode) with multi tenant isolation.

## Decision

**Chosen option**: Option 1: First class Member roster with FIFO DebtRecord ledger and calculator quick pick integration

We implement dedicated `Member` and `DebtRecord` entities in FastAPI and PostgreSQL, scoped by authenticated `host_id`. The frontend provides a dedicated "Thành viên" navigation tab, member inspection drawer, debt settlement dialog, and calculator quick pick chips.

**Implementation skills**:
- Python FastAPI & SQLAlchemy 2.0 Async for repository and query scoping.
- React 19, TypeScript, Tailwind CSS v4, Lucide Icons, and Radix UI for mobile touch drawer and settlement modals.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:
- `Member`:
  - `id`: UUID (UUIDv7 primary key)
  - `host_id`: UUID (Foreign key `hosts.id`, ondelete CASCADE, indexed)
  - `name`: String(100), required
  - `phone`: String(20), nullable, indexed
  - `gender`: String(10), required ('male' or 'female')
  - `default_note`: Text, nullable
  - `total_debt`: Numeric(12, 2), default 0.0, nullable False
  - `is_active`: Boolean, default True, nullable False
  - `created_at`, `updated_at`: Timestamp (UTC)
- `DebtRecord`:
  - `id`: UUID (UUIDv7 primary key)
  - `host_id`: UUID (Foreign key `hosts.id`, ondelete CASCADE, indexed)
  - `member_id`: UUID (Foreign key `members.id`, ondelete CASCADE, indexed)
  - `session_id`: UUID (Foreign key `sessions.id`, ondelete SET NULL, nullable, indexed)
  - `amount_owed`: Numeric(12, 2), required
  - `amount_paid`: Numeric(12, 2), default 0.0, nullable False
  - `status`: String(20), default 'unpaid' ('unpaid', 'partially_paid', 'settled', 'forgiven')
  - `settled_at`: Timestamp (UTC), nullable
  - `note`: Text, nullable
  - `created_at`, `updated_at`: Timestamp (UTC)
- `SessionParticipant`:
  - `member_id`: UUID (Foreign key `members.id`, ondelete SET NULL, nullable, indexed)
  - `payment_status`: String(20), default 'paid' ('paid', 'unpaid')

**State transitions**:
- `DebtRecord` lifecycle:
  - `unpaid` (created upon saving session with unpaid participant)
  - `partially_paid` (when payment amount < amount_owed - amount_paid)
  - `settled` (when amount_paid == amount_owed)
  - `forgiven` (when host manually writes off the remaining balance)

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/members` | GET | `search: str?`, `active_only: bool = true` | list of MemberResponse | Optional Bearer | 401 unauth |
| `/api/v1/members` | POST | `name`, `phone?`, `gender`, `default_note?` | MemberResponse | Optional Bearer | 400 validation, 422 |
| `/api/v1/members/{id}` | GET | `id: UUID` | MemberDetailResponse (with debt summary) | Optional Bearer | 404 not found |
| `/api/v1/members/{id}` | PUT | `name?`, `phone?`, `gender?`, `default_note?`, `is_active?` | MemberResponse | Optional Bearer | 404 not found |
| `/api/v1/members/{id}` | DELETE | `id: UUID` | 204 No Content | Optional Bearer | 404 not found |
| `/api/v1/members/{id}/debts` | GET | `status: str?`, `limit: int = 50` | list of DebtRecordResponse | Optional Bearer | 404 not found |
| `/api/v1/members/{id}/settle` | POST | `amount: float`, `note: str?`, `forgive_remainder: bool = false` | SettleDebtResponse (settled records, new balance) | Optional Bearer | 400 invalid amount, 404 |
| `/api/v1/debt-records` | GET | `status: str?`, `member_id: UUID?` | list of DebtRecordResponse | Optional Bearer | 401 unauth |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Member creation | Member ID & timestamps | UUIDv7 helper & UTC server clock |
| Member total debt | `total_debt` displayed on roster badge | Sum of (`amount_owed` - `amount_paid`) for all active DebtRecords |
| Calculator quick pick | Participant name & gender pre filled | Selected `Member.name` & `Member.gender` |
| Session debt creation | `amount_owed` on new DebtRecord | Calculated `participant.calculated_fee` from session engine |
| FIFO Debt settlement | `amount_paid` and `status` updates | Allocated sequentially across oldest `unpaid` DebtRecords |
| VietQR debt reminder | Dynamic payment link & message | Host banking profile from `Host` record + member `total_debt` |

**Key invariants**:
- Member `total_debt` must equal the sum of (`amount_owed` - `amount_paid`) across all non settled debt records.
- Deleting a member cascades to its debt records, while deleting a session preserves debt records with `session_id = NULL`.
- All queries and mutations must filter by the authenticated `host_id` (or guest host UUID).

**Security model**:
- Multi tenant query scoping: All member and debt records are isolated per host.
- Host permissions: Only the host who created the member can view, edit, or settle their debts.

**Configuration required**:
- No external API keys required for core member roster and VietQR quick links.

**Critical test scenarios**:
- Member roster CRUD: Create member, update details, search by phone, and soft delete, verifies **AC-1**
- Calculator quick pick: Tap member chip, verify participant and gender count updated, verifies **AC-2**
- Auto debt generation: Save session with 1 paid and 1 unpaid member participant, verify 1 DebtRecord created and member balance updated, verifies **AC-3**
- Member detail ledger: Fetch member profile, verify list of attended sessions and debt records, verifies **AC-4**
- FIFO Debt settlement: Settle 150,000 VND against two 100,000 VND debts, verify first debt settled and second partially paid with 50,000 VND remaining, verifies **AC-5**
- VietQR reminder generation: Generate reminder text with VietQR link matching total debt, verifies **AC-6**
- Cross tenant isolation: Verify Host B cannot read or settle Host A member debts, verifies **AC-7**

## Build plan

- [x] 1. Backend Member and Debt API: Implement FastAPI routes for Member CRUD, Debt listing, and FIFO settlement endpoint (`/api/v1/members/*`), satisfies **AC-1**, **AC-4**, **AC-5**, **AC-7**
- [x] 2. Backend Session Debt Integration: Hook session persistence route to automatically create `DebtRecord` entries for participants flagged as unpaid, satisfies **AC-3**
- [x] 3. Frontend Member Management UI: Build Member roster view with search, filter, badge indicators, creation drawer, and member detail view in "Thành viên" tab, satisfies **AC-1**, **AC-4**
- [x] 4. Frontend Calculator Member Quick-Pick: Integrate member chip selector and quick add into calculator player count section, satisfies **AC-2**
- [x] 5. Frontend Debt Settlement & VietQR Reminder Drawer: Build settlement modal dialog with FIFO amount input and copyable VietQR debt reminder card, satisfies **AC-5**, **AC-6**

## Consequences

**Positive**:
- Hosts save significant time during weekly games by tapping frequent players instead of typing names.
- Automatic debt tracking prevents forgotten payments and awkward manual calculation across multiple sessions.
- Pre-filled VietQR payment reminders make it frictionless for players to transfer money immediately via banking apps.

**Negative / tradeoffs**:
- Requires managing member state in local cache when operating in offline mode.
- FIFO settlement requires clear ledger explanations if players ask about specific historical sessions.

## Follow-up

- [ ] Future feature: Add automated SMS/Zalo ZNS debt reminder messaging integration when SMS provider is connected.
