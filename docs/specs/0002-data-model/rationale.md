# Rationale: Core data model and PostgreSQL schema

## Context

Badminton session organizers (hosts) face complex financial calculations at the end of each session. They must account for court rental fees, shuttlecock consumption, drinks, gender pricing variations, and multi stage attendance where players leave early or stay for extra sets.

Without a well structured database schema, financial calculations become error prone, historical session records are lost, and hosts cannot accurately track unpaid member balances across weeks.

The data model must support two operational modes:
1. Fast offline or standalone calculations in browser local storage without requiring host registration.
2. Synchronized database persistence in PostgreSQL when a host logs in to manage venues, save sessions, and track debts.

## Options considered

### Option 1: UUID v7 Relational Schema with Dedicated Expenses Table (Recommended)

Store entities across normalized PostgreSQL tables with UUID v7 primary keys. Additional expenses (drinks, extra shuttlecocks) live in a dedicated `session_expenses` child table, and host bank details are snapshot copied into each session at creation time.

**Pros**:
- UUID v7 provides monotonic time ordering for sequential index inserts and distributed safety.
- Itemized expense table allows flexible line items without schema migrations.
- Bank snapshot preserves historical accuracy of past payment requests.
- Nullable member reference on participants accommodates both one off guests and regular roster members.

**Cons**:
- Requires relational joins across participants and expenses when querying full session details.

### Option 2: Document / JSONB Blob per Session

Store host and venue tables as basic rows, but save the entire session (participants, expenses, calculations) as a single JSONB document inside the sessions table.

**Pros**:
- Simple single row read and write operations.
- Schema flexibility for arbitrary calculation metadata.

**Cons**:
- Cannot enforce database foreign key constraints between participants and member rosters.
- Difficult to aggregate debt queries and player attendance history using SQL.

## Rationale

Badminton hosting involves clear relational workflows: a host manages multiple venues, organizes sessions, tracks members, and reconciles individual debts. A normalized relational model ensures strict ACID transactional safety when recording payments and balances.

Using UUID v7 combines the indexing performance of sequential IDs with the security and offline generation capability of UUIDs. The dedicated expenses table supports varied club purchases (Revive drinks, shuttlecock tubes, court water) cleanly without schema bloat.
