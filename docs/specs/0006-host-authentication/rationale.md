# Rationale: Host authentication

## Context

In Slices 1 and 2, organizers operated in pre authentication mode where calculations, court venues, and session logs defaulted to a shared guest host account or local browser cache. While this enabled immediate skateboard usability, organizers cannot access their saved courts, historical sessions, or member rosters across multiple devices without authenticating.

Furthermore, multi tenant data isolation is necessary before introducing Member and Debt Tracking in Slice 4 to prevent cross host data pollution and ensure strict financial privacy.

## Options considered

### Option 1: Dual Google OAuth and Phone OTP authentication with JWT bearer tokens, refresh token rotation, and guest record claiming (Chosen)

Support sign in with Google OAuth for rapid one tap web authentication and Vietnamese phone number OTP for users who prefer mobile phone verification. Access and refresh JWT tokens manage sessions, and guest data is automatically claimed upon first login.

**Pros**:
- Optimal mobile user experience with zero password friction.
- Google OAuth provides instant profile photos and email verification.
- Phone OTP aligns with Vietnamese user habits on mobile sport apps.
- Existing guest records are seamlessly preserved rather than lost upon login.

**Cons**:
- Requires maintaining two authentication providers and an ephemeral OTP verification table.

### Option 2: Traditional Email and Password authentication

Require organizers to sign up with email and create a password.

**Pros**:
- Simple backend implementation without external OAuth or SMS dependencies.

**Cons**:
- High friction on mobile devices; organizers frequently forget passwords or abandon registration on court.

## Rationale

Option 1 provides the lowest friction entry path for badminton organizers while maintaining strict cryptographic security. Passwordless phone OTP and Google sign in match modern mobile application standards in Vietnam. Automatic guest data claiming ensures organizers who started calculations without an account can sign up without losing existing courts or match logs.
