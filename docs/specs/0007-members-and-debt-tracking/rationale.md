# Rationale: 0007. Members and debt tracking

## Context

Badminton organizers manage groups of 8 to 20 frequent players who participate in weekly sessions. In the existing workflow, hosts manually type player names on court and frequently deal with delayed payments where members leave early or pay via bank transfer days later. Organizers need a centralized roster to quickly select regular attendees and an automated ledger to record unpaid balances, log partial settlements, and generate payment reminders with VietQR quick links.

## Options considered

### Option 1: First class Member roster with FIFO DebtRecord ledger and calculator integration (Chosen)
- **Description**: Dedicated `Member` and `DebtRecord` entities stored in PostgreSQL, with quick pick chips in the calculator and FIFO balance settlement.
- **Pros**:
  - Direct integration into the core calculator saves hosts significant time per session.
  - Granular `DebtRecord` line items keep a clear audit trail linking debts directly to specific game sessions.
  - FIFO debt settlement makes recording generic bank transfers (e.g. 200,000 VND) effortless without requiring manual line item matching.
  - Multi tenant isolation ensures complete privacy for player contact information and balances.
- **Cons**:
  - Sightly higher backend schema complexity compared to a flat balance counter.

### Option 2: Simple running balance counter without session debt records
- **Description**: A single `total_debt` field on `Member` with manual + / - adjustments.
- **Pros**:
  - Simplest database schema.
- **Cons**:
  - No audit trail or session linkage; hosts cannot explain how a member accumulated a specific debt balance if questioned.
  - Cannot automatically generate debt records upon session completion.

### Option 3: External ledger integration (e.g. Google Sheets export)
- **Description**: Export session participant debts to external spreadsheets.
- **Pros**:
  - Zero database storage for debt records.
- **Cons**:
  - Breaks seamless mobile web experience on court.
  - Cannot auto generate dynamic VietQR debt payment links inside the app.

## Decision

We select **Option 1**. It delivers an optimal experience on mobile devices, providing exact session auditability with minimal organizer effort during active badminton games.

## References

- Project conventions: [AGENTS.md](../../AGENTS.md)
- Data model specification: [0002-data-model](../0002-data-model/index.md)
- Core calculator specification: [0004-core-calculator-and-vietqr-bill](../0004-core-calculator-and-vietqr-bill/index.md)
