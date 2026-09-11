# Verify: Host authentication · spec 0006 · updated 2026-09-10
_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Open header login button → expect bottom sheet drawer to open with Google and Phone tabs → AC-1, AC-2
- [x] Click Google login button → expect active login session with host avatar in header → AC-1
- [x] Switch to Phone tab, enter Vietnamese phone number (0987654321), click send OTP → expect 60 second countdown timer and code input → AC-2
- [x] Enter OTP code 123456 → expect authenticated session and toast greeting → AC-2
- [x] Create guest venue in unauthenticated mode, log in as host → expect guest venues and sessions claimed and linked to host account → AC-3
- [x] Switch to Settings tab, update display name and default VietQR bank details, click Save → expect changes saved and auto filled into calculator VietQR bill card → AC-5
- [x] Click Log out in Settings tab → expect active refresh token revoked and client returned to guest mode → AC-7

## Commands
- [x] `PYTHONPATH=. backend/.venv/bin/pytest backend/tests/test_auth_api.py` → all backend authentication, token rotation, tenant scoping, and guest claim tests pass → AC-1, AC-2, AC-3, AC-4, AC-6, AC-7
- [x] `npm test --prefix frontend` → all frontend AuthContext, LoginSheet, and ProfileSettingsView tests pass → AC-1, AC-2, AC-5, AC-6, AC-7
- [x] `npm run build --prefix frontend` → TypeScript typecheck and Vite production build pass cleanly → AC-1, AC-2, AC-5

## Value sourcing coverage
- Google OAuth token exchange: Google token parsed into host profile and JWT tokens returned → verified by `test_auth_google_login`
- Phone OTP verification: Phone number matched with hashed OTP code and session created → verified by `test_auth_phone_otp_lifecycle`
- Token rotation: Expired access token refreshed and old refresh token revoked → verified by `test_auth_token_refresh_and_rotation`
- Multi tenant isolation: Queries for venues and sessions filtered by authenticated host UUID → verified by `test_auth_claim_guest_data_and_tenant_scoping`
- Profile and bank settings persistence: Updated bank account details saved in database and synced to local calculator storage → verified by `test_auth_update_profile_and_bank`

## Acceptance criteria coverage
- AC-1 Google OAuth login covered by UI step 2 and test `test_auth_google_login`
- AC-2 Phone OTP verification covered by UI steps 3 and 4 and test `test_auth_phone_otp_lifecycle`
- AC-3 Guest data migration covered by UI step 5 and test `test_auth_claim_guest_data_and_tenant_scoping`
- AC-4 Protected route scoping covered by test `test_auth_claim_guest_data_and_tenant_scoping`
- AC-5 Profile and default VietQR bank management covered by UI step 6 and test `test_auth_update_profile_and_bank`
- AC-6 Silent JWT refresh covered by test `test_auth_token_refresh_and_rotation`
- AC-7 Logout covered by UI step 7 and test `test_auth_logout`
