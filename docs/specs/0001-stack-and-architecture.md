# 0001. Stack and architecture

**Date**: 2026-09-09
**Status**: Accepted

## Summary

This specification establishes the foundational technology stack for the Host Badminton web application. The platform adopts a decoupled architecture featuring a FastAPI Python backend for robust calculation and data persistence, paired with a React TypeScript frontend optimized for mobile web interactions. PostgreSQL serves as the relational database to guarantee data integrity for financial splits, sessions, and debt tracking.

## Context

Host Badminton is a specialized web application designed for badminton session organizers and court hosts. Unlike generic court booking platforms, the application addresses the operational workflows of the host on the court: calculating shuttlecock and court fees, handling uneven gender pricing, accommodating early leavers across multiple split stages, generating VietQR payment cards, and tracking member debts over time.

Because hosts primarily operate the application on smartphones directly at the badminton venue, the system requires ultra fast mobile responsiveness, instant client side calculations, and dependable data persistence. The development team requires a clean architecture that allows rapid MVP iteration under the Skateboard build approach while supporting future capabilities such as authentication, historical logs, and debt management.

## Options considered

### Option 1: Decoupled FastAPI (Python) backend and React (TypeScript) frontend

This option combines a FastAPI asynchronous REST API service with a lightweight React and Vite Single Page Application organized within a unified repository structure.

**Pros**:
- High execution performance with asynchronous request handling and automatic OpenAPI documentation generation.
- Strict data validation and serialization powered by Pydantic v2.
- Rich React component ecosystem with Tailwind CSS and Shadcn UI for responsive mobile touch interfaces.
- Clear separation between calculation engine logic and client presentation.

**Cons**:
- Requires managing two runtime environments (Python and Node.js) during local development.

### Option 2: Full stack Next.js (TypeScript) application

This option uses Next.js App Router with Server Actions and React Server Components in a single unified TypeScript codebase.

**Pros**:
- Single language across the entire stack with seamless end to end type sharing.
- Unified deployment model on serverless platforms.

**Cons**:
- Increased complexity around server client component boundaries for client heavy interactive calculator widgets.
- Does not leverage Python for backend data analysis or specialized algorithms.

### Option 3: Monolithic Django with Server Rendered Templates and HTMX

This option utilizes Django with traditional server rendered templates enhanced by HTMX for dynamic interactions.

**Pros**:
- Batteries included framework with built in administrative dashboard and authentication.
- Single runtime environment without complex client side build tooling.

**Cons**:
- Slower client side reactivity for complex dynamic multi stage split calculations.
- Less flexible for creating standalone exportable VietQR card views and offline capable client states.

## Decision

**Chosen option**: Option 1: Decoupled FastAPI (Python) backend and React (TypeScript) frontend.

We adopt a modular monorepo architecture with a FastAPI Python backend and a React Vite TypeScript frontend backed by PostgreSQL.

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Backend Language | Python 3.12+ | Robust ecosystem with modern async features and strict typing support |
| Backend Framework | FastAPI | High performance asynchronous API framework with automatic Swagger documentation |
| Data Validation | Pydantic v2 | Fast compiled validation and schema definition for request and response payloads |
| Frontend Framework | Vite + React (TypeScript) | Fast build tool and responsive Single Page Application optimized for mobile browsers |
| Styling & UI Components | Tailwind CSS v4 + Shadcn UI | Accessible, clean, touch friendly components built on Radix UI primitives |
| Primary Database | PostgreSQL (via Supabase or Neon) | ACID compliant relational database ensuring integrity for financial splits and debts |
| ORM & Migrations | SQLAlchemy 2.0 (Async) + Alembic | Modern asynchronous database access with structured version controlled migrations |
| Authentication | Supabase Auth / JWT (Google OAuth & Phone OTP) | Reliable identity management supporting both Google login and phone verification |
| Python Environment | uv (or virtualenv) | Ultra fast dependency resolution and reproducible environment locking |
| Payment Card Generation | VietQR client library + Canvas / SVG | Instant client side VietQR payment card rendering with custom host bank accounts |

## Rationale

The decoupled FastAPI and React architecture provides the ideal balance between developer velocity and long term maintainability. 

FastAPI provides type safe request handling through Pydantic, enabling clear data schemas for session calculations, player rosters, and financial records. The automatic generation of OpenAPI schemas ensures that frontend API integration remains synchronized and predictable.

On the client side, React with Vite and Tailwind CSS allows the construction of a mobile first, touch friendly interface. Organizers can perform instant calculations on the court without network latency, while the backend persists session records, player profiles, and outstanding balances securely in PostgreSQL.

## Consequences

**Positive**:
- Backend calculations and business logic remain isolated, testable, and reusable.
- The frontend delivers instant feedback on mobile devices with zero lag during input adjustments.
- Database schema changes are strictly versioned through Alembic migrations.
- The interactive OpenAPI documentation simplifies testing and frontend client generation.

**Negative**:
- Local development requires running both the FastAPI server (e.g. via uvicorn) and the Vite development server concurrently.
- Cross Origin Resource Sharing (CORS) policies must be explicitly configured for local and production environments.

## Follow-up

- [ ] Initialize repository structure with `frontend/` and `backend/` directories.
- [ ] Scaffold FastAPI backend with Python 3.12+, uv package manager, and basic healthcheck route.
- [ ] Scaffold React Vite frontend with TypeScript, Tailwind CSS, and Lucide icons.
- [ ] Run `/audit` to capture project conventions and tooling into root `AGENTS.md`.
