import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_session_history_lifecycle_and_aggregates(client: AsyncClient):
    # 1. Create a venue first
    venue_res = await client.post(
        "/api/v1/venues",
        json={
            "name": "Sân Thống Nhất History Test",
            "default_court_rate": 150000.0,
        },
    )
    assert venue_res.status_code == 201
    venue_id = venue_res.json()["id"]

    # 2. Create Session 1
    session1_payload = {
        "venue_id": venue_id,
        "session_date": "2026-09-08",
        "court_fee": 150000.0,
        "shuttlecock_fee": 60000.0,
        "total_expenses": 210000.0,
        "gender_split_mode": "equal",
        "participants": [
            {
                "display_name": "Nam 1",
                "gender": "male",
                "calculated_fee": 35000.0,
                "is_paid": True,
            },
            {
                "display_name": "Nam 2",
                "gender": "male",
                "calculated_fee": 35000.0,
                "is_paid": False,
            },
            {
                "display_name": "Nữ 1",
                "gender": "female",
                "calculated_fee": 35000.0,
                "is_paid": True,
            },
        ],
        "expenses": [
            {
                "category": "drink",
                "item_name": "Nước suối",
                "quantity": 2,
                "unit_price": 10000.0,
                "total_amount": 20000.0,
            }
        ],
    }
    create1_res = await client.post("/api/v1/sessions", json=session1_payload)
    assert create1_res.status_code == 201
    session1_id = create1_res.json()["id"]

    # 3. List Sessions
    list_res = await client.get("/api/v1/sessions")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total_count"] >= 1
    assert list_data["total_revenue"] >= 210000.0
    assert list_data["total_participants"] >= 3

    # Verify summary items contain venue name and participant count
    matching = next((s for s in list_data["items"] if s["id"] == session1_id), None)
    assert matching is not None
    assert matching["venue_name"] == "Sân Thống Nhất History Test"
    assert matching["participant_count"] == 3
    assert matching["paid_count"] == 2

    # 4. Filter by Venue ID
    venue_filtered_res = await client.get(f"/api/v1/sessions?venue_id={venue_id}")
    assert venue_filtered_res.status_code == 200
    vf_data = venue_filtered_res.json()
    assert vf_data["total_count"] >= 1
    assert all(s["venue_id"] == venue_id for s in vf_data["items"])

    # 5. Filter by Date range
    date_filtered_res = await client.get(
        "/api/v1/sessions?start_date=2026-09-01&end_date=2026-09-09"
    )
    assert date_filtered_res.status_code == 200
    assert any(s["id"] == session1_id for s in date_filtered_res.json()["items"])

    # 6. Delete Session
    del_res = await client.delete(f"/api/v1/sessions/{session1_id}")
    assert del_res.status_code == 204

    # 7. Verify deletion
    get_res = await client.get(f"/api/v1/sessions/{session1_id}")
    assert get_res.status_code == 404

