
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_google_login(client: AsyncClient):
    # 1. Google sign in with mock token
    payload = {"credential_token": "mock-google-token-host123"}
    res = await client.post("/api/v1/auth/google", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["host"]["email"] == "host123@gmail.com"
    assert data["host"]["full_name"] == "Google User host123"

    access_token = data["access_token"]

    # 2. Get profile /me
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "host123@gmail.com"


@pytest.mark.asyncio
async def test_auth_phone_otp_lifecycle(client: AsyncClient):
    phone = "0987654321"

    # 1. Request OTP
    send_res = await client.post("/api/v1/auth/phone/send-otp", json={"phone": phone})
    assert send_res.status_code == 200
    assert send_res.json()["expires_in"] == 300

    # 2. Verify with invalid code
    bad_res = await client.post(
        "/api/v1/auth/phone/verify-otp", json={"phone": phone, "code": "000000"}
    )
    assert bad_res.status_code == 400

    # 3. Verify with dev code 123456
    verify_res = await client.post(
        "/api/v1/auth/phone/verify-otp", json={"phone": phone, "code": "123456"}
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["host"]["phone"] == phone
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_auth_token_refresh_and_rotation(client: AsyncClient):
    # 1. Login with Google to obtain initial token pair
    login_res = await client.post(
        "/api/v1/auth/google", json={"credential_token": "mock-google-token-rotatetest"}
    )
    assert login_res.status_code == 200
    initial_tokens = login_res.json()
    r1 = initial_tokens["refresh_token"]

    # 2. Refresh token
    refresh_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": r1})
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens
    r2 = new_tokens["refresh_token"]
    assert r2 != r1

    # 3. Attempt to reuse old revoked refresh token r1 (should fail)
    reuse_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": r1})
    assert reuse_res.status_code == 401


@pytest.mark.asyncio
async def test_auth_update_profile_and_bank(client: AsyncClient):
    # 1. Login
    login_res = await client.post(
        "/api/v1/auth/google", json={"credential_token": "mock-google-token-profiletest"}
    )
    access_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 2. Update profile with bank info
    update_payload = {
        "full_name": "Nguyễn Văn Host",
        "bank_bin": "970422",
        "bank_name": "MB Bank",
        "bank_account_number": "0987654321",
        "bank_account_name": "NGUYEN VAN HOST",
    }
    update_res = await client.put("/api/v1/auth/me", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    host_data = update_res.json()
    assert host_data["full_name"] == "Nguyễn Văn Host"
    assert host_data["bank_bin"] == "970422"
    assert host_data["bank_account_number"] == "0987654321"


@pytest.mark.asyncio
async def test_auth_claim_guest_data_and_tenant_scoping(client: AsyncClient):
    # 1. Create guest venue and session as unauthenticated guest
    guest_venue_res = await client.post(
        "/api/v1/venues",
        json={"name": "Sân Guest Kỳ Hòa", "default_court_rate": 120000.0},
    )
    assert guest_venue_res.status_code == 201
    guest_venue = guest_venue_res.json()
    guest_venue_id = guest_venue["id"]

    guest_session_res = await client.post(
        "/api/v1/sessions",
        json={
            "venue_id": guest_venue_id,
            "session_date": "2026-09-10",
            "court_fee": 120000.0,
            "shuttlecock_fee": 40000.0,
            "total_expenses": 160000.0,
            "gender_split_mode": "equal",
            "participants": [
                {"display_name": "Guest Player 1", "gender": "male", "calculated_fee": 80000.0}
            ],
            "expenses": [],
        },
    )
    assert guest_session_res.status_code == 201
    guest_session_id = guest_session_res.json()["id"]

    # 2. Sign in as Authenticated Host
    auth_res = await client.post(
        "/api/v1/auth/google", json={"credential_token": "mock-google-token-claimhost"}
    )
    auth_data = auth_res.json()
    auth_token = auth_data["access_token"]
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    # At this point, authenticated host has 0 venues
    auth_venues_res = await client.get("/api/v1/venues", headers=auth_headers)
    assert auth_venues_res.status_code == 200
    assert len(auth_venues_res.json()) == 0

    # 3. Get guest host id from guest venue response or guest query
    # In pre-auth mode, the venue was assigned to the default guest host.
    # We can claim using the default guest host ID or arbitrary UUID.
    # Let's inspect the venue's host_id by fetching without auth
    all_guest_venues = (await client.get("/api/v1/venues")).json()
    assert len(all_guest_venues) >= 1

    # Claim using the guest host id (we can fetch the session detail which carries host_id)
    guest_session = (await client.get(f"/api/v1/sessions/{guest_session_id}")).json()
    guest_host_id = guest_session["host_id"]

    claim_res = await client.post(
        "/api/v1/auth/claim-guest-data",
        json={"guest_host_id": guest_host_id},
        headers=auth_headers,
    )
    assert claim_res.status_code == 200
    claim_data = claim_res.json()
    assert claim_data["claimed_venues"] >= 1
    assert claim_data["claimed_sessions"] >= 1

    # 4. Now authenticated host sees the claimed venue and session!
    scoped_venues = (await client.get("/api/v1/venues", headers=auth_headers)).json()
    assert any(v["id"] == guest_venue_id for v in scoped_venues)

    scoped_sessions = (await client.get("/api/v1/sessions", headers=auth_headers)).json()
    assert any(s["id"] == guest_session_id for s in scoped_sessions["items"])


@pytest.mark.asyncio
async def test_auth_logout(client: AsyncClient):
    # 1. Login
    login_res = await client.post(
        "/api/v1/auth/google", json={"credential_token": "mock-google-token-logouttest"}
    )
    data = login_res.json()
    access_token = data["access_token"]
    refresh_token = data["refresh_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 2. Logout
    logout_res = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
        headers=headers,
    )
    assert logout_res.status_code == 204

    # 3. Verify refresh token is revoked
    refresh_res = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 401


@pytest.mark.asyncio
async def test_auth_tenant_isolation_cross_account(client: AsyncClient):
    # Host A creates a venue
    login_a = await client.post(
        "/api/v1/auth/google", json={"credential_token": "mock-google-token-hostA"}
    )
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    venue_a_res = await client.post(
        "/api/v1/venues",
        json={"name": "Sân Cầu Lông Host A", "default_court_rate": 100000.0},
        headers=headers_a,
    )
    assert venue_a_res.status_code == 201
    venue_a_id = venue_a_res.json()["id"]

    # Host B logs in
    login_b = await client.post(
        "/api/v1/auth/google", json={"credential_token": "mock-google-token-hostB"}
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Host B listing venues should NOT see Host A's venue
    venues_b_res = await client.get("/api/v1/venues", headers=headers_b)
    assert venues_b_res.status_code == 200
    venues_b = venues_b_res.json()
    assert all(v["id"] != venue_a_id for v in venues_b)

    # Host B cannot delete Host A's venue
    delete_res = await client.delete(f"/api/v1/venues/{venue_a_id}", headers=headers_b)
    assert delete_res.status_code == 404


@pytest.mark.asyncio
async def test_auth_invalid_tokens_and_validation(client: AsyncClient):
    # Invalid Bearer token
    bad_auth_headers = {"Authorization": "Bearer invalid.jwt.token"}
    res = await client.get("/api/v1/auth/me", headers=bad_auth_headers)
    assert res.status_code == 401

    # Missing authorization header
    res_no_auth = await client.get("/api/v1/auth/me")
    assert res_no_auth.status_code == 401

    # Invalid OTP format / missing field
    res_bad_phone = await client.post("/api/v1/auth/phone/send-otp", json={})
    assert res_bad_phone.status_code == 422

