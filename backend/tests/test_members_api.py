import uuid
import pytest
from httpx import AsyncClient

from backend.app.models.host import Host


@pytest.mark.asyncio
async def test_member_crud_lifecycle(client: AsyncClient):
    # 1. Create Member
    create_payload = {
        "name": "Nguyễn Văn A",
        "phone": "0901234567",
        "gender": "male",
        "default_note": "Chuyên đánh đôi",
        "is_active": True,
    }
    create_res = await client.post("/api/v1/members", json=create_payload)
    assert create_res.status_code == 201
    member = create_res.json()
    member_id = member["id"]
    assert member["name"] == "Nguyễn Văn A"
    assert member["phone"] == "0901234567"
    assert member["gender"] == "male"
    assert member["total_debt"] == 0.0
    assert member["is_active"] is True

    # 2. Get Member Detail
    detail_res = await client.get(f"/api/v1/members/{member_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == member_id
    assert detail["attended_sessions_count"] == 0
    assert detail["debt_records"] == []

    # 3. List Members with search & active filter
    list_res = await client.get("/api/v1/members?search=090123")
    assert list_res.status_code == 200
    members = list_res.json()
    assert len(members) >= 1
    assert any(m["id"] == member_id for m in members)

    # 4. Update Member
    update_payload = {
        "name": "Nguyễn Văn A (Pro)",
        "phone": "0909999999",
        "is_active": False,
    }
    update_res = await client.put(f"/api/v1/members/{member_id}", json=update_payload)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["name"] == "Nguyễn Văn A (Pro)"
    assert updated["phone"] == "0909999999"
    assert updated["is_active"] is False

    # 5. Filter active only
    active_res = await client.get("/api/v1/members?active_only=true")
    assert active_res.status_code == 200
    assert not any(m["id"] == member_id for m in active_res.json())

    # 6. Delete Member
    del_res = await client.delete(f"/api/v1/members/{member_id}")
    assert del_res.status_code == 204

    # 7. Verify not found
    get_res = await client.get(f"/api/v1/members/{member_id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_session_auto_debt_generation(client: AsyncClient):
    # 1. Create a member
    member_res = await client.post(
        "/api/v1/members",
        json={"name": "Trần Thị B", "phone": "0912345678", "gender": "female"},
    )
    assert member_res.status_code == 201
    member = member_res.json()
    member_id = member["id"]

    # 2. Create a session with this member as an unpaid participant
    session_payload = {
        "session_date": "2026-09-11",
        "start_time": "18:00:00",
        "end_time": "20:00:00",
        "court_fee": 150000.0,
        "shuttlecock_fee": 50000.0,
        "shuttlecock_count": 5,
        "shuttlecock_unit_price": 10000.0,
        "total_expenses": 200000.0,
        "gender_split_mode": "equal",
        "expenses": [
            {
                "category": "court",
                "item_name": "Tiền sân 2h",
                "quantity": 1,
                "unit_price": 150000.0,
                "total_amount": 150000.0,
            }
        ],
        "participants": [
            {
                "member_id": member_id,
                "display_name": "Trần Thị B",
                "gender": "female",
                "play_stage": "full",
                "calculated_fee": 100000.0,
                "is_paid": False,
                "paid_amount": 0.0,
            },
            {
                "display_name": "Khách Vãng Lai",
                "gender": "male",
                "play_stage": "full",
                "calculated_fee": 100000.0,
                "is_paid": True,
                "paid_amount": 100000.0,
            },
        ],
    }

    session_res = await client.post("/api/v1/sessions", json=session_payload)
    assert session_res.status_code == 201

    # 3. Verify member total_debt updated and DebtRecord created
    member_detail_res = await client.get(f"/api/v1/members/{member_id}")
    assert member_detail_res.status_code == 200
    detail = member_detail_res.json()
    assert detail["total_debt"] == 100000.0
    assert detail["attended_sessions_count"] == 1
    assert len(detail["debt_records"]) == 1
    assert detail["debt_records"][0]["amount_owed"] == 100000.0
    assert detail["debt_records"][0]["amount_paid"] == 0.0
    assert detail["debt_records"][0]["status"] == "unpaid"


@pytest.mark.asyncio
async def test_fifo_debt_settlement(client: AsyncClient):
    # 1. Create a member
    member_res = await client.post(
        "/api/v1/members",
        json={"name": "Lê Hoàng C", "gender": "male"},
    )
    assert member_res.status_code == 201
    member_id = member_res.json()["id"]

    # 2. Create 2 sessions where member owes 100k and 100k (Total debt = 200k)
    for i in range(2):
        s_res = await client.post(
            "/api/v1/sessions",
            json={
                "session_date": f"2026-09-0{i+1}",
                "total_expenses": 100000.0,
                "expenses": [],
                "participants": [
                    {
                        "member_id": member_id,
                        "display_name": "Lê Hoàng C",
                        "gender": "male",
                        "calculated_fee": 100000.0,
                        "is_paid": False,
                    }
                ],
            },
        )
        assert s_res.status_code == 201

    # Check total debt is 200k
    m_res = await client.get(f"/api/v1/members/{member_id}")
    assert m_res.json()["total_debt"] == 200000.0
    assert len(m_res.json()["debt_records"]) == 2

    # 3. Settle 150,000 VND (FIFO allocation)
    settle_res = await client.post(
        f"/api/v1/members/{member_id}/settle",
        json={
            "amount": 150000.0,
            "note": "Chuyển khoản VietQR",
            "forgive_remainder": False,
        },
    )
    assert settle_res.status_code == 200
    settle_data = settle_res.json()
    assert settle_data["settled_amount"] == 150000.0
    assert settle_data["remaining_debt"] == 50000.0
    assert settle_data["settled_records_count"] == 2

    # 4. Verify debts state
    debts_res = await client.get(f"/api/v1/members/{member_id}/debts")
    assert debts_res.status_code == 200
    debts = debts_res.json()
    assert len(debts) == 2
    # Debts are sorted by created_at desc, so the older one (debt 1) is index 1 or we check statuses
    statuses = [d["status"] for d in debts]
    assert "settled" in statuses
    assert "partially_paid" in statuses

    # 5. Forgive remainder on remaining debt
    forgive_res = await client.post(
        f"/api/v1/members/{member_id}/settle",
        json={
            "amount": 10000.0,
            "note": "Trả 10k và miễn phần còn lại",
            "forgive_remainder": True,
        },
    )
    assert forgive_res.status_code == 200
    assert forgive_res.json()["remaining_debt"] == 0.0

    # 6. Global debt records list
    global_debts_res = await client.get(f"/api/v1/debt-records?member_id={member_id}")
    assert global_debts_res.status_code == 200
    assert len(global_debts_res.json()) == 2


@pytest.mark.asyncio
async def test_member_validation_and_error_cases(client: AsyncClient):
    # 1. Invalid creation (empty name)
    bad_member_res = await client.post(
        "/api/v1/members",
        json={"name": "", "gender": "male"},
    )
    assert bad_member_res.status_code == 422

    # 2. Get non-existent member
    non_existent_id = str(uuid.uuid4())
    not_found_res = await client.get(f"/api/v1/members/{non_existent_id}")
    assert not_found_res.status_code == 404

    # 3. Update non-existent member
    update_404_res = await client.put(
        f"/api/v1/members/{non_existent_id}",
        json={"name": "Ghost Player"},
    )
    assert update_404_res.status_code == 404

    # 4. Delete non-existent member
    del_404_res = await client.delete(f"/api/v1/members/{non_existent_id}")
    assert del_404_res.status_code == 404

    # 5. Settle non-existent member
    settle_404_res = await client.post(
        f"/api/v1/members/{non_existent_id}/settle",
        json={"amount": 50000.0},
    )
    assert settle_404_res.status_code == 404

    # 6. Settle with invalid amount (<= 0)
    member_res = await client.post(
        "/api/v1/members",
        json={"name": "Phạm Văn D", "gender": "male"},
    )
    assert member_res.status_code == 201
    member_id = member_res.json()["id"]

    zero_settle_res = await client.post(
        f"/api/v1/members/{member_id}/settle",
        json={"amount": 0.0},
    )
    assert zero_settle_res.status_code == 422

    negative_settle_res = await client.post(
        f"/api/v1/members/{member_id}/settle",
        json={"amount": -10000.0},
    )
    assert negative_settle_res.status_code == 422

    # 7. Settle when member has 0 debt
    settle_zero_debt_res = await client.post(
        f"/api/v1/members/{member_id}/settle",
        json={"amount": 50000.0},
    )
    assert settle_zero_debt_res.status_code == 200
    assert settle_zero_debt_res.json()["settled_amount"] == 50000.0
    assert settle_zero_debt_res.json()["remaining_debt"] == 0.0
    assert settle_zero_debt_res.json()["settled_records_count"] == 0


@pytest.mark.asyncio
async def test_members_and_debt_tenant_isolation(client: AsyncClient):
    # Host A registers
    host_a_res = await client.post(
        "/api/v1/auth/phone/verify-otp", json={"phone": "0911111111", "code": "123456"}
    )
    assert host_a_res.status_code == 200
    token_a = host_a_res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Host B registers
    host_b_res = await client.post(
        "/api/v1/auth/phone/verify-otp", json={"phone": "0922222222", "code": "123456"}
    )
    assert host_b_res.status_code == 200
    token_b = host_b_res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Host A creates a member
    create_a_res = await client.post(
        "/api/v1/members",
        json={"name": "Member of Host A", "phone": "0933333333", "gender": "male"},
        headers=headers_a,
    )
    assert create_a_res.status_code == 201
    member_a_id = create_a_res.json()["id"]

    # Host B lists members: should NOT see Member of Host A
    list_b_res = await client.get("/api/v1/members", headers=headers_b)
    assert list_b_res.status_code == 200
    members_b = list_b_res.json()
    assert not any(m["id"] == member_a_id for m in members_b)

    # Host B tries to get Member of Host A directly: 404
    get_b_res = await client.get(f"/api/v1/members/{member_a_id}", headers=headers_b)
    assert get_b_res.status_code == 404

    # Host B tries to settle Member of Host A: 404
    settle_b_res = await client.post(
        f"/api/v1/members/{member_a_id}/settle",
        json={"amount": 50000.0},
        headers=headers_b,
    )
    assert settle_b_res.status_code == 404
