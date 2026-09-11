# Host Badminton

## Stack

- **Backend**: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), Alembic, PostgreSQL
- **Frontend**: React (TypeScript), Vite, Tailwind CSS v4, Lucide Icons, Shadcn UI
- **Package managers**: uv (Python) and npm (Node.js)

## Build approach

Skateboard (ship the thinnest usable whole first, then grow it).

## Commands

```bash
# Backend dev server (FastAPI)
PYTHONPATH=. backend/.venv/bin/uvicorn backend.app.main:app --reload --port 8000

# Backend test suite
PYTHONPATH=. backend/.venv/bin/pytest backend/tests/

# Frontend dev server (Vite + React)
cd frontend && npm run dev

# Frontend build & typecheck
cd frontend && npm run build
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Clean Architecture: strict layer separation, domain logic never touches frameworks or I/O.
- Dependency rule: outer layers depend on inner layers, never the reverse.
- Type strictness: strict typing across TypeScript and Pydantic v2, zero use of any.
- Cross boundary communication uses validated Pydantic schemas or TypeScript interfaces.
- Linting and format: Ruff for Python and ESLint + Prettier for TypeScript.
- Tests: unit test core business logic; integration test APIs against real database endpoints.
- Mobile first UI: all frontend components must support touch gestures and mobile viewports.

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone

## Context files

- [backend/AGENTS.md](backend/AGENTS.md): FastAPI application, database connections, schemas, and endpoints
- [frontend/AGENTS.md](frontend/AGENTS.md): Vite React Single Page Application, Tailwind CSS v4, and UI components

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
