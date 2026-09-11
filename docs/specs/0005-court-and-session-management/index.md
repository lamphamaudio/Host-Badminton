# 0005. Court and session management

**Date**: 2026-09-10
**Status**: Accepted

## Summary

This specification defines court venue profile management and session history persistence for badminton organizers. It allows organizers to store preferred badminton courts with default hourly rates, pick courts directly inside the calculator, save finalized match sessions with complete cost breakdowns to the database, and browse historical sessions with date filters, summary statistics, and VietQR card replay.

## Requirements

**User stories**:
- As a badminton organizer, I want to create and manage court venue profiles with default hourly rates so that I do not need to re enter court details every week.
- As a badminton organizer, I want to pick a saved venue inside the calculator to automatically populate hourly rates and venue notes into my active session.
- As a badminton organizer, I want to explicitly save my completed session calculations to the database so that I maintain a permanent log of all game expenses and player fees.
- As a badminton organizer, I want to browse past session history with filters and summary totals so that I can audit historical revenues, player counts, and individual payment records.
- As a badminton organizer, I want to inspect past session details, replay the VietQR payment bill card, or load past match settings back into the calculator for today's game.

**Acceptance criteria**:
- **AC-1**: Organizer can create, view, edit, and deactivate court venue profiles with venue name, address, court numbers, and default hourly court rate.
- **AC-2**: Organizer can select a saved venue inside the Calculator to automatically populate default hourly court rates and venue details into the active session.
- **AC-3**: Organizer can explicitly save a completed calculation session from the calculator to the database with all participant fees, expense breakdown, and VietQR banking metadata.
- **AC-4**: Organizer can browse historical session logs in chronological order with date range filters, venue filters, and limit offset pagination.
- **AC-5**: Session history summary displays aggregated statistics including total sessions count, total revenue, and total player count across filtered results.
- **AC-6**: Organizer can inspect full past session details in a slide over drawer including individual participant payment statuses, cost breakdowns, and VietQR payment card replay with image download and text copying.
- **AC-7**: Organizer can re open past session parameters (court venue, court rate, shuttlecock rate, and participant list) into the active calculator for a new match.
- **AC-8**: Offline fallback preserves saved sessions in browser local storage queue and synchronizes them once network connection is restored.

## Decision

**Chosen option**: Option 1: Dedicated Courts tab and Quick Select inside Calculator with soft delete venue lifecycle and limit offset history pagination

We implement dedicated venue management and session history logging using existing SQLAlchemy models, FastAPI REST endpoints, and lightweight React async hooks.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:
- `Venue`:
  - `id`: UUID (UUIDv7 primary key)
  - `host_id`: UUID (Foreign key `hosts.id`, required)
  - `name`: String(150), required
  - `address`: Text, nullable
  - `court_number`: String(50), nullable (example: "Sân 1, 2")
  - `default_court_rate`: Numeric(12, 2), nullable
  - `is_active`: Boolean, default True
  - `created_at`, `updated_at`: Timestamp (UTC)
- `Session`:
  - `id`: UUID (UUIDv7 primary key)
  - `host_id`: UUID (Foreign key `hosts.id`, required)
  - `venue_id`: UUID (Foreign key `venues.id`, nullable, ondelete SET NULL)
  - `session_date`: Date, required
  - `start_time`, `end_time`: Time, nullable
  - `status`: String(20), default "completed"
  - `court_fee`, `shuttlecock_fee`, `total_expenses`: Numeric(12, 2)
  - `shuttlecock_count`: Integer, nullable
  - `shuttlecock_unit_price`: Numeric(12, 2), nullable
  - `gender_split_mode`: String(20), default "equal"
  - `fixed_female_fee`, `fixed_male_fee`: Numeric(12, 2), nullable
  - `is_multi_stage`: Boolean, default False
  - `stage1_cost`, `stage2_cost`: Numeric(12, 2), default 0
  - `bank_bin`, `bank_account_number`, `bank_account_name`, `vietqr_memo`: String, nullable
  - `note`: Text, nullable
  - Relationships: `venue` (Venue), `expenses` (list of `SessionExpense`), `participants` (list of `SessionParticipant`)

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/v1/venues | GET | include_inactive: bool = False | list[VenueResponse] | Public guest host | 500 internal |
| /api/v1/venues | POST | name: str (req), address: str, court_number: str, default_court_rate: float | VenueResponse | Public guest host | 422 invalid |
| /api/v1/venues/{id} | GET | id: UUID in path | VenueResponse | Public guest host | 404 not found |
| /api/v1/venues/{id} | PUT | name: str, address: str, court_number: str, default_court_rate: float, is_active: bool | VenueResponse | Public guest host | 404, 422 |
| /api/v1/venues/{id} | DELETE | id: UUID in path | VenueResponse (is_active=False) | Public guest host | 404 not found |
| /api/v1/sessions | GET | limit: int = 20, offset: int = 0, start_date: date, end_date: date, venue_id: UUID, status: str | SessionListResponse (items, total_count, total_revenue, total_participants) | Public guest host | 422 invalid |
| /api/v1/sessions | POST | SessionCreate payload (date, venue_id, fees, expenses, participants, bank) | SessionDetailResponse | Public guest host | 422 invalid |
| /api/v1/sessions/{id} | GET | id: UUID in path | SessionDetailResponse | Public guest host | 404 not found |
| /api/v1/sessions/{id} | DELETE | id: UUID in path | 204 No Content | Public guest host | 404 not found |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| List venues | Venue names, default rates, court numbers | `venues` table columns |
| Auto fill calculator court rate | Hourly court rate input | `venues.default_court_rate` column |
| Save session | Session record, expenses, participants, bank details | Client calculator form state sent to `POST /api/v1/sessions` |
| List session history | Historical match cards, dates, total cost, player count | `sessions` table joined with `venues` and aggregated participants |
| Session history summary stats | Total sessions count, total revenue, total players | Backend SQL aggregate query (`count(sessions.id)`, `sum(sessions.total_expenses)`, `count(session_participants.id)`) |
| Inspect session detail | Line items, player fees, payment statuses, VietQR card replay | `sessions` table joined with `session_expenses` and `session_participants` |
| Replay in calculator | Venue, court fee, shuttlecock fee, player names | Selected `SessionDetailResponse` fields loaded into frontend calculator state |

**Key invariants**:
- Deactivating a venue sets `is_active = False` and preserves all foreign key links on historical sessions.
- Session total expenses must equal the sum of court fee plus shuttlecock fee plus extra expense line items.
- Every persisted session record contains an immutable snapshot of the host bank credentials used when the bill was generated.

**Security model**:
- In the pre authentication phase (Slice 2), requests default to the single local host record. All endpoints are accessible to the organizer on the local host instance. Cross tenant isolation will be bound to host identity tokens in Slice 3.

**Critical test scenarios**:
- Happy path: Create a new venue, select it in the calculator, calculate session split, save session, verify it appears in History tab with correct summary stats, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**
- Venue soft delete: Soft delete a venue, verify it disappears from active dropdowns but past sessions retain the venue name, verifies **AC-1**, **AC-4**
- Session inspect & replay: Open past session from history, inspect VietQR bill card, copy bill text, click replay in calculator, verify active calculator inputs populate with past settings, verifies **AC-6**, **AC-7**
- Offline resilience: Disconnect network, save session, verify local storage queue stores session and alerts user, restore network, verify background sync succeeds, verifies **AC-8**

## Build plan

1. Backend Venue CRUD API: Pydantic schemas (`VenueCreate`, `VenueUpdate`, `VenueResponse`), repository queries, and FastAPI router endpoints (`GET`, `POST`, `PUT`, `DELETE /api/v1/venues`), satisfies **AC-1**
2. Backend Session History API: Paginated query with date and venue filters, summary aggregate calculations (`total_count`, `total_revenue`, `total_participants`), and session deletion endpoint, satisfies **AC-4**, **AC-5**
3. Frontend Venue Management UI: Courts navigation tab, venue list cards, create and edit venue drawer, and quick select dropdown inside calculator, satisfies **AC-1**, **AC-2**
4. Frontend Session History & Replay: Save Session action with confirmation feedback, History tab list cards with filter controls, past session inspection drawer, and VietQR replay action, satisfies **AC-3**, **AC-6**, **AC-7**
5. Frontend Offline Persistence & Sync: Local storage queue for offline session saves with automatic network status listener and background sync, satisfies **AC-8**

## Consequences

**Positive**:
- Organizers save substantial time setting up sessions because court rates and frequent venues are remembered.
- Permanent audit trail of all historical games, expenses, player splits, and payment snapshots.
- Seamless VietQR replay allows re sharing past bills with late paying players.

**Negative / tradeoffs**:
- Storing session snapshots requires periodic database cleanup or archiving as history grows over multiple years.
- Offline queuing introduces potential synchronization conflicts if multiple tabs or devices are used simultaneously before host authentication lands in Slice 3.

## Follow-up

- [ ] Host authentication integration in Slice 3 to bind venue and session queries to authenticated host accounts.
