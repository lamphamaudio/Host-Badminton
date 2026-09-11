# Backend

## Overview

FastAPI backend providing asynchronous REST endpoints for session calculation, court management, user authentication, and member debt tracking.

## Key files

| File | Owns |
|---|---|
| `app/main.py` | FastAPI application factory, CORS middleware, route registration |
| `app/core/config.py` | Pydantic v2 Settings model and environment variable parsing |
| `app/core/database.py` | SQLAlchemy async engine, sessionmaker, and Base declarative model |
| `app/api/router.py` | Main API v1 routing assembly |
| `app/api/routes/health.py` | Healthcheck endpoint (`/api/v1/health`) |
| `app/api/routes/members.py` | Member roster CRUD, debt listing, and FIFO settlement endpoints |

## Commands

```bash
# Run dev server
PYTHONPATH=. backend/.venv/bin/uvicorn backend.app.main:app --reload --port 8000

# Run tests
PYTHONPATH=. backend/.venv/bin/pytest backend/tests/
```

## Conventions

- Async by default: use `async def` for route handlers and asynchronous database calls.
- Strict Pydantic models for all request bodies and response schemas.
- Centralize database access in repositories and use cases.
- Environment variables configured via `app/core/config.py`.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
