# Rationale: Court and session management

## Context

Badminton session organizers frequently organize games at a small set of recurring court facilities. Without saved venue profiles, organizers must repeatedly look up and manually type court numbers, addresses, and hourly court rates every time they run the session calculator.

Additionally, after generating a VietQR payment bill and sharing it with participants, organizers currently lose calculation state when navigating away or clearing browser storage. Organizers require a reliable historical log of past sessions to track historical expenses, check which players were in attendance, replay or re download VietQR bills for late payers, and re use previous match cost settings.

## Options considered

### Option 1: Dedicated Courts tab and Quick Select inside Calculator with soft delete venue lifecycle and limit offset history pagination (Chosen)

Provide a dedicated Courts management screen to list, create, edit, and deactivate venues, plus a quick select picker inside the calculator. Sessions are explicitly persisted to PostgreSQL via FastAPI endpoints, with limit offset pagination and summary aggregates for historical inspection.

**Pros**:
- Clear mental model for organizers separating venue administration from day to day calculation.
- Soft deletion preserves foreign key relationships on past games.
- Paginated listing with SQL aggregates provides fast query performance even as history grows.

**Cons**:
- Requires creating separate UI tabs and route handlers for venue administration and session history.

### Option 2: Pure client side local storage persistence only

Persist venues and sessions entirely within browser local storage without backend database endpoints.

**Pros**:
- Zero backend schema or API changes required.
- Works fully offline by default.

**Cons**:
- Data is lost if the organizer clears browser cache or switches mobile devices.
- Cannot support multi device synchronization, backup, or future member debt aggregation in Slice 4.

## Rationale

Option 1 provides the necessary permanent database storage foundation while keeping client side interactions fast and responsive. By utilizing soft deletion for venues, historical sessions retain their associated court location and name even if a venue is no longer actively in use. Integrating the venue selector directly into the calculator reduces repetitive data entry on game days, fulfilling the skateboard product philosophy.
