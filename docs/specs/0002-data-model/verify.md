# Verify: Data model · spec 0002 · updated 2026-09-09

_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [x] `PYTHONPATH=. backend/.venv/bin/pytest backend/tests/test_models.py -k test_uuid7` → UUIDv7 time ordering and version 7 check passes → AC-8
- [x] `PYTHONPATH=. backend/.venv/bin/pytest backend/tests/test_models.py -k test_create_host_and_relationships` → Host, Venue, Member, Session, Expense, Participant, Debt relational creation passes → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- [x] `PYTHONPATH=. backend/.venv/bin/pytest backend/tests/test_models.py -k test_cascade_delete_host` → Cascade deletion on Host passes → AC-8
- [x] `PYTHONPATH=. backend/.venv/bin/pytest backend/tests/test_schemas.py` → Pydantic v2 schemas and validation contracts pass → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- [x] `PYTHONPATH=. backend/.venv/bin/alembic -c backend/alembic.ini check || true` → Alembic migration definitions load cleanly → AC-8

## Acceptance-criteria coverage

- AC-1: Host profile and banking information → covered by `test_create_host_and_relationships`, `test_host_schema_validation`
- AC-2: Venues management → covered by `test_create_host_and_relationships`, `test_venue_schema_validation`
- AC-3: Members roster → covered by `test_create_host_and_relationships`, `test_member_schema_validation`
- AC-4: Sessions financial persistence → covered by `test_create_host_and_relationships`, `test_session_and_expenses_schema_validation`
- AC-5: Session itemized expenses → covered by `test_create_host_and_relationships`, `test_session_and_expenses_schema_validation`
- AC-6: Session participants and fees → covered by `test_create_host_and_relationships`, `test_session_and_expenses_schema_validation`
- AC-7: Debt tracking records → covered by `test_create_host_and_relationships`, `test_debt_record_schema_validation`
- AC-8: UUIDv7 PK, cascade rules, and indexes → covered by `test_uuid7_generation_and_ordering`, `test_cascade_delete_host`
