# 0006. Host authentication

**Date**: 2026-09-10
**Status**: Accepted

## Summary

This specification defines host authentication and user profile management for Host Badminton. It provides secure sign in and sign up for badminton organizers via Google OAuth and Vietnamese phone number OTP, issues JWT access and refresh tokens, scopes all court venues and session history records to the authenticated host account, claims existing local guest data on first login, and enables organizers to manage their profile and default VietQR banking information.

## Requirements

**User stories**:
- As a badminton organizer, I want to sign in with Google or my phone number so that my saved courts and session records are securely stored and synced across devices.
- As an organizer who previously used the app as a guest, I want my guest venues and match history automatically linked to my new account upon login so that I do not lose past records.
- As an organizer, I want to manage my profile and default banking details in a dedicated Settings tab so that my VietQR payment cards auto fill with my preferred bank account.
- As an organizer, I want to stay logged in seamlessly through automatic token refresh without having to re enter OTP codes during weekly games.

**Acceptance criteria**:
- **AC-1**: Host can sign in or sign up using Google OAuth, returning valid JWT access and refresh tokens and profile snapshot.
- **AC-2**: Host can sign in or sign up using Vietnamese phone number OTP verification with 60s cooldown timer and 5 minute code expiry.
- **AC-3**: Application seamlessly claims and reassigns local guest venues and historical sessions to the authenticated host account upon first sign in.
- **AC-4**: Protected backend endpoints (`/venues`, `/sessions`, `/members`, `/debt`) require valid JWT bearer authentication and automatically scope queries to `current_user.id`.
- **AC-5**: Host can view and update their profile information (display name, avatar, phone, email) and default VietQR banking details (bank BIN, account number, account name) in the Settings screen.
- **AC-6**: Client application performs silent JWT token refresh on expiration without interrupting active user workflows.
- **AC-7**: Host can log out, revoking the active refresh token and returning client state to guest mode.

## Decision

**Chosen option**: Option 1: Dual Google OAuth and Phone OTP authentication with JWT bearer tokens, refresh token rotation, and guest record claiming

We implement dual authentication via Google OAuth and database backed phone OTP with JWT access and refresh tokens. All database queries for venues, sessions, and members are filtered by authenticated `host_id`.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:
- `Host` (Updated fields):
  - `id`: UUID (UUIDv7 primary key)
  - `phone`: String(20), nullable, unique, indexed
  - `email`: String(255), nullable, unique, indexed
  - `full_name`: String(100), required
  - `avatar_url`: String(500), nullable
  - `google_sub`: String(255), nullable, unique, indexed
  - `is_active`: Boolean, default True
  - `bank_bin`, `bank_name`, `bank_account_number`, `bank_account_name`: String, nullable
  - `created_at`, `updated_at`: Timestamp (UTC)
- `RefreshToken`:
  - `id`: UUID (UUIDv7 primary key)
  - `host_id`: UUID (Foreign key `hosts.id`, ondelete CASCADE, indexed)
  - `token_hash`: String(255), unique, indexed
  - `expires_at`: Timestamp (UTC)
  - `revoked`: Boolean, default False
  - `created_at`: Timestamp (UTC)
- `PhoneOTP`:
  - `id`: UUID (UUIDv7 primary key)
  - `phone`: String(20), indexed
  - `code_hash`: String(255)
  - `expires_at`: Timestamp (UTC, 5 minutes)
  - `is_used`: Boolean, default False
  - `attempts`: Integer, default 0
  - `created_at`: Timestamp (UTC)

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/v1/auth/google | POST | credential_token: str (req) | AuthResponse (tokens, host) | Public | 400 invalid, 422 |
| /api/v1/auth/phone/send-otp | POST | phone: str (req) | { message: str, expires_in: int } | Public | 429 rate limit, 422 |
| /api/v1/auth/phone/verify-otp | POST | phone: str (req), code: str (req) | AuthResponse (tokens, host) | Public | 400 bad code, 410 expired |
| /api/v1/auth/refresh | POST | refresh_token: str (req) | TokenResponse (access, refresh) | Public | 401 invalid token |
| /api/v1/auth/me | GET | none | HostResponse | Bearer JWT | 401 unauthorized |
| /api/v1/auth/me | PUT | full_name: str, bank details | HostResponse | Bearer JWT | 401, 422 |
| /api/v1/auth/claim-guest-data | POST | guest_host_id: UUID | { claimed_venues: int, claimed_sessions: int } | Bearer JWT | 401 unauthorized |
| /api/v1/auth/logout | POST | refresh_token: str (req) | 204 No Content | Bearer JWT | 401 unauthorized |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Google sign in | Host ID, email, name, avatar | Google OAuth token verification (`oauth2.googleapis.com`) |
| Phone OTP sign in | Host ID, phone number | Verified `PhoneOTP` record matched against `hosts.phone` |
| Token generation | JWT access and refresh tokens | Signed with backend `SECRET_KEY` containing host UUID subject |
| Claim guest data | Transferred venues and sessions count | Database update query transferring records from guest UUID to `current_host.id` |
| Profile & bank settings | Host name, email, phone, bank info | `hosts` table columns for `current_host.id` |
| Authenticated data queries | Scoped venues and session records | Current authenticated host UUID injected via `get_current_active_host` dependency |

**Key invariants**:
- Access tokens expire after 30 minutes; refresh tokens expire after 30 days and rotate upon each refresh request.
- Phone numbers must be valid 10 digit Vietnamese mobile numbers (prefix 03, 05, 07, 08, 09).
- A single host account can link both a phone number and a Google account.

**Security model**:
- Passwords are not used; authentication relies on verified Google tokens or cryptographic OTP verification.
- Tokens use HMAC SHA256 signing with secret key from environment configuration.
- All mutating endpoints require valid Bearer token authorization; guest fallback mode applies only when no Authorization header is present.

**Configuration required**:
- `JWT_SECRET_KEY`: secret key used to sign and verify JWT tokens
- `GOOGLE_CLIENT_ID`: OAuth client ID for Google identity verification
- `SMS_PROVIDER_API_KEY`: API key for SMS gateway in production (mock provider used in dev)

**Critical test scenarios**:
- Google sign in: Send valid Google credential, verify new host record created and JWT tokens returned, verifies **AC-1**
- Phone OTP verification: Request OTP for phone number, verify code, receive JWT tokens, verifies **AC-2**
- Guest data migration: Create guest venue and session, sign in, call claim guest data, verify records now belong to authenticated host, verifies **AC-3**
- Protected route isolation: Attempt accessing protected endpoint without token, verify 401; access with token, verify queries return only host's records, verifies **AC-4**
- Profile & bank update: Update bank account number and name in Settings, verify changes persist and calculator auto fills with updated bank, verifies **AC-5**
- Silent token refresh: Call refresh endpoint with valid refresh token, receive new token pair, verify old refresh token revoked, verifies **AC-6**
- Logout: Call logout, verify refresh token is invalidated, verifies **AC-7**

## Build plan

- [x] 1. Backend Auth Core & Models: Update Host model, create RefreshToken and PhoneOTP tables with Alembic migration, and configure JWT token utilities, satisfies **AC-1**, **AC-2**
- [x] 2. Backend Auth API: Implement Google OAuth verification, Phone OTP generation and verification, token refresh, and guest data claim endpoints (`/api/v1/auth/*`), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**, **AC-7**
- [x] 3. Backend Security Scoping: Inject `get_current_active_host` dependency across `/venues` and `/sessions` routers to scope all queries to authenticated host ID, satisfies **AC-4**
- [x] 4. Frontend Auth Context & Services: Implement `AuthContext`, `useAuth` hook, token storage, and API interceptor with automatic silent token refresh, satisfies **AC-1**, **AC-2**, **AC-6**
- [x] 5. Frontend Auth Modals & Profile UI: Login modal drawer with Google One Tap and Phone OTP tab, Settings profile view with profile editing and synchronized VietQR banking card, satisfies **AC-1**, **AC-2**, **AC-5**, **AC-7**

## Consequences

**Positive**:
- Organizers can securely access and manage their data across phones, tablets, and laptops.
- Multi tenant database isolation protects organizer financial records and player lists.
- Default bank details configured once in Settings automatically sync to all future VietQR payment bills.

**Negative / tradeoffs**:
- Requires managing OAuth credentials and SMS OTP delivery service costs in production environments.
- Offline mode requires storing valid session tokens securely on client devices.

## Follow-up

- [ ] Connect production SMS gateway provider (eSMS or Zalo ZNS) before public production launch.
