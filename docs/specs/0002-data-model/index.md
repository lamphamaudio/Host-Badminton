# 0002. Core data model and PostgreSQL schema

**Date**: 2026-09-09
**Status**: Accepted

## Summary

This specification defines the database tables and relational schema for the Host Badminton platform. It establishes models for host accounts, badminton venues, player rosters, match sessions, itemized expenses, participant splits, and debt records. All primary keys use time ordered UUID v7 identifiers to guarantee efficient indexing and distributed safety.

## Requirements

**User stories**:
- As a badminton host, I want to store my profile and default bank details so payment bills automatically include my VietQR payment information.
- As a badminton host, I want to save frequently used badminton courts so I do not have to retype venue names and addresses.
- As a badminton host, I want to maintain a member roster so I can quickly pick recurring players for sessions and track their unpaid balances.
- As a badminton host, I want to persist session cost breakdowns and player payment statuses so I can review historical records.
- As a badminton host, I want to record outstanding player debts so I know exactly who owes money across sessions.

**Acceptance criteria**:
- **AC-1**: Host profile table stores host identity (phone, email, full name) and default VietQR banking information (bank BIN, bank name, account number, account holder name).
- **AC-2**: Venues table stores court locations with a required name, optional address, optional court number, and default hourly rate linked to the host.
- **AC-3**: Members table maintains frequent player rosters per host with name, phone, gender, notes, and aggregated balance.
- **AC-4**: Sessions table persists match records with date, time, status, court fee, shuttlecock cost (flat or unit quantity times unit price), total expenses, gender split rule (equal split, fixed female, fixed male), multi stage cost pools (stage 1 base pool, stage 2 extra pool), and immutable bank snapshot details.
- **AC-5**: Session expenses table supports itemized line items (drinks, revive, extra shuttlecock boxes, accessories) with category, item name, quantity, unit price, and total amount.
- **AC-6**: Session participants table links players (either ad hoc walk in by name or linked to members table) with gender, play stage (full session, early leaver, or stayer), computed fee, custom fee override, payment status, and paid timestamp.
- **AC-7**: Debt records table tracks outstanding and settled balances between host and members with amount owed, amount paid, status, and settlement timestamps.
- **AC-8**: All database tables use UUID v7 primary keys, foreign key constraints with cascade rules, and indexes on lookup columns (host ID, session ID, member ID).

## Decision

**Chosen option**: Option 1: UUID v7 Relational Schema with Dedicated Expenses Table

We adopt a normalized relational schema with UUID v7 primary keys in PostgreSQL 16+, using SQLAlchemy 2.0 async models and Alembic migrations.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

1. **`hosts`**
   - `id`: UUID (PK, v7)
   - `phone`: VARCHAR(20), nullable, unique indexed
   - `email`: VARCHAR(255), nullable, unique indexed
   - `full_name`: VARCHAR(100), required
   - `bank_bin`: VARCHAR(20), nullable (e.g. 970422 for MBBank, 970436 for VCB)
   - `bank_name`: VARCHAR(100), nullable
   - `bank_account_number`: VARCHAR(50), nullable
   - `bank_account_name`: VARCHAR(100), nullable
   - `created_at`: TIMESTAMPTZ, default now
   - `updated_at`: TIMESTAMPTZ, default now

2. **`venues`**
   - `id`: UUID (PK, v7)
   - `host_id`: UUID, FK -> hosts.id (ON DELETE CASCADE, indexed)
   - `name`: VARCHAR(150), required
   - `address`: TEXT, nullable
   - `court_number`: VARCHAR(50), nullable
   - `default_court_rate`: NUMERIC(12, 2), nullable
   - `is_active`: BOOLEAN, default true
   - `created_at`: TIMESTAMPTZ, default now
   - `updated_at`: TIMESTAMPTZ, default now

3. **`members`**
   - `id`: UUID (PK, v7)
   - `host_id`: UUID, FK -> hosts.id (ON DELETE CASCADE, indexed)
   - `name`: VARCHAR(100), required
   - `phone`: VARCHAR(20), nullable
   - `gender`: VARCHAR(10), required ('male' or 'female')
   - `default_note`: TEXT, nullable
   - `total_debt`: NUMERIC(12, 2), default 0
   - `is_active`: BOOLEAN, default true
   - `created_at`: TIMESTAMPTZ, default now
   - `updated_at`: TIMESTAMPTZ, default now

4. **`sessions`**
   - `id`: UUID (PK, v7)
   - `host_id`: UUID, FK -> hosts.id (ON DELETE CASCADE, indexed)
   - `venue_id`: UUID, nullable, FK -> venues.id (ON DELETE SET NULL, indexed)
   - `session_date`: DATE, required
   - `start_time`: TIME, nullable
   - `end_time`: TIME, nullable
   - `status`: VARCHAR(20), default 'draft' ('draft', 'active', 'completed', 'cancelled')
   - `court_fee`: NUMERIC(12, 2), default 0
   - `shuttlecock_fee`: NUMERIC(12, 2), default 0
   - `shuttlecock_count`: INT, nullable
   - `shuttlecock_unit_price`: NUMERIC(12, 2), nullable
   - `total_expenses`: NUMERIC(12, 2), default 0
   - `gender_split_mode`: VARCHAR(20), default 'equal' ('equal', 'fixed_female', 'fixed_male')
   - `fixed_female_fee`: NUMERIC(12, 2), nullable
   - `fixed_male_fee`: NUMERIC(12, 2), nullable
   - `is_multi_stage`: BOOLEAN, default false
   - `stage1_cost`: NUMERIC(12, 2), default 0
   - `stage2_cost`: NUMERIC(12, 2), default 0
   - `bank_bin`: VARCHAR(20), nullable (host bank snapshot)
   - `bank_account_number`: VARCHAR(50), nullable (host bank snapshot)
   - `bank_account_name`: VARCHAR(100), nullable (host bank snapshot)
   - `vietqr_memo`: VARCHAR(255), nullable
   - `note`: TEXT, nullable
   - `created_at`: TIMESTAMPTZ, default now
   - `updated_at`: TIMESTAMPTZ, default now

5. **`session_expenses`**
   - `id`: UUID (PK, v7)
   - `session_id`: UUID, FK -> sessions.id (ON DELETE CASCADE, indexed)
   - `category`: VARCHAR(50), required ('court', 'shuttlecock', 'drink', 'other')
   - `item_name`: VARCHAR(100), required
   - `quantity`: NUMERIC(8, 2), default 1
   - `unit_price`: NUMERIC(12, 2), required
   - `total_amount`: NUMERIC(12, 2), required
   - `created_at`: TIMESTAMPTZ, default now

6. **`session_participants`**
   - `id`: UUID (PK, v7)
   - `session_id`: UUID, FK -> sessions.id (ON DELETE CASCADE, indexed)
   - `member_id`: UUID, nullable, FK -> members.id (ON DELETE SET NULL, indexed)
   - `display_name`: VARCHAR(100), required
   - `gender`: VARCHAR(10), required ('male' or 'female')
   - `play_stage`: VARCHAR(20), default 'full' ('full', 'early_leaver', 'stayer', 'custom')
   - `custom_fee_override`: NUMERIC(12, 2), nullable
   - `calculated_fee`: NUMERIC(12, 2), default 0
   - `is_paid`: BOOLEAN, default false
   - `paid_amount`: NUMERIC(12, 2), default 0
   - `payment_method`: VARCHAR(20), nullable ('vietqr', 'cash', 'transfer', 'other')
   - `paid_at`: TIMESTAMPTZ, nullable
   - `note`: TEXT, nullable
   - `created_at`: TIMESTAMPTZ, default now
   - `updated_at`: TIMESTAMPTZ, default now

7. **`debt_records`**
   - `id`: UUID (PK, v7)
   - `host_id`: UUID, FK -> hosts.id (ON DELETE CASCADE, indexed)
   - `member_id`: UUID, FK -> members.id (ON DELETE CASCADE, indexed)
   - `session_id`: UUID, nullable, FK -> sessions.id (ON DELETE SET NULL, indexed)
   - `amount_owed`: NUMERIC(12, 2), required
   - `amount_paid`: NUMERIC(12, 2), default 0
   - `status`: VARCHAR(20), default 'unpaid' ('unpaid', 'partially_paid', 'settled', 'forgiven')
   - `settled_at`: TIMESTAMPTZ, nullable
   - `note`: TEXT, nullable
   - `created_at`: TIMESTAMPTZ, default now
   - `updated_at`: TIMESTAMPTZ, default now

**State transitions**:
- `sessions.status`: `draft` -> `active` -> `completed` (or `cancelled`)
- `debt_records.status`: `unpaid` -> `partially_paid` -> `settled` (or `forgiven`)

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/v1/venues | POST | name:str (req), address:str (opt), court_number:str (opt) | id:uuid, name:str | Bearer | 400 invalid, 401 unauthorized |
| /api/v1/venues | GET | None | items:list[VenueResponse] | Bearer | 401 unauthorized |
| /api/v1/members | POST | name:str (req), gender:str (req), phone:str (opt) | id:uuid, name:str | Bearer | 400 invalid, 401 unauthorized |
| /api/v1/members | GET | None | items:list[MemberResponse] | Bearer | 401 unauthorized |
| /api/v1/sessions | POST | session_date:date, court_fee:decimal, participants:list | id:uuid, total_expenses:decimal | Bearer (or Public Guest) | 422 invalid calculation |
| /api/v1/sessions/{id} | GET | None | session_detail:SessionResponse | Bearer (or Public Guest) | 404 not found |
| /api/v1/debts | GET | member_id:uuid (opt), status:str (opt) | items:list[DebtResponse] | Bearer | 401 unauthorized |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Create Venue | Venue Record | User input name, address, court number |
| Create Member | Member Record | User input name, gender, phone |
| Create Session | Session Summary | Form inputs and calculation engine output |
| Calculate Fee | Individual Participant Fee | Calculated via gender and stage rules |
| Generate VietQR | VietQR QuickLink URL / Memo | Session bank snapshot and participant fee |
| Log Debt | Debt Record | Outstanding participant fee where is_paid is false |

**Key invariants**:
- Every session total cost must equal `court_fee + shuttlecock_fee + sum(session_expenses.total_amount)`.
- Sum of participant fees must cover session total cost within acceptable rounding variance (+/- 1,000 VND).
- `stage1_cost + stage2_cost` must equal session total cost when `is_multi_stage` is true.
- A member's cached `total_debt` must equal the sum of unsettled `amount_owed - amount_paid` records.

**Security model**:
- Multi tenant host isolation: All queries filter by `host_id` extracted from the authenticated JWT token.
- Cascade deletion: Deleting a host deletes all child venues, members, sessions, and debt records.
- Deleting a venue or member sets FK references on sessions to NULL so historical financial reports remain intact.

**Configuration required**:
- `DATABASE_URL`: PostgreSQL connection string (asyncpg driver)

**Critical test scenarios**:
- Happy path: Create venue, create member, create session with itemized expenses and participants, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
- Failure case: Attempt to create session with negative costs or non existent host ID fails with validation error, verifies **AC-4**, **AC-8**.
- Auth/permission: Host A cannot access or query members or sessions belonging to Host B, verifies **AC-8**.

## Build plan

1. [x] Create UUID v7 helper and SQLAlchemy declarative base models for `Host`, `Venue`, `Member`, `Session`, `SessionExpense`, `SessionParticipant`, and `DebtRecord`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**
2. [x] Configure Alembic migration environment and generate initial migration script, satisfies **AC-8**
3. [x] Create Pydantic v2 validation schemas and response models for all entities, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**
4. [x] Write integration test suite verifying relational constraints, cascade deletions, and index performance against real database, satisfies **AC-8**

## Consequences

**Positive**:
- Clear, standardized database foundation supporting all current and future badminton club features.
- High performance sequential inserts via UUID v7.
- Flexible expense modeling and robust debt tracking.

**Negative / tradeoffs**:
- Slightly more complex migration and join queries compared to a single unstructured JSON document.

**Neutral**:
- Requires Alembic migration setup to keep local and staging databases synchronized.

## Follow-up

- [ ] Connect PostgreSQL instance in docker-compose or local environment for live migration execution.
