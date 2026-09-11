import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_venue_crud_lifecycle(client: AsyncClient):
    # 1. Create Venue
    create_payload = {
        "name": "Sân Cầu Lông Kỳ Hòa Test",
        "address": "238 Ba Tháng Hai, Q.10",
        "court_number": "Sân 3",
        "default_court_rate": 140000.0,
        "is_active": True,
    }
    create_res = await client.post("/api/v1/venues", json=create_payload)
    assert create_res.status_code == 201
    venue_data = create_res.json()
    venue_id = venue_data["id"]
    assert venue_data["name"] == "Sân Cầu Lông Kỳ Hòa Test"
    assert venue_data["default_court_rate"] == 140000.0
    assert venue_data["is_active"] is True

    # 2. Get Venue by ID
    get_res = await client.get(f"/api/v1/venues/{venue_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == venue_id

    # 3. List Venues
    list_res = await client.get("/api/v1/venues")
    assert list_res.status_code == 200
    venues = list_res.json()
    assert any(v["id"] == venue_id for v in venues)

    # 4. Update Venue
    update_payload = {
        "name": "Sân Cầu Lông Kỳ Hòa VIP",
        "default_court_rate": 160000.0,
    }
    update_res = await client.put(f"/api/v1/venues/{venue_id}", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Sân Cầu Lông Kỳ Hòa VIP"
    assert update_res.json()["default_court_rate"] == 160000.0

    # 5. Delete (Soft delete) Venue
    del_res = await client.delete(f"/api/v1/venues/{venue_id}")
    assert del_res.status_code == 200
    assert del_res.json()["is_active"] is False

    # 6. Verify excluded from active list by default
    list_active_res = await client.get("/api/v1/venues?include_inactive=false")
    assert list_active_res.status_code == 200
    assert not any(v["id"] == venue_id for v in list_active_res.json())

    # 7. Included when include_inactive=true
    list_all_res = await client.get("/api/v1/venues?include_inactive=true")
    assert list_all_res.status_code == 200
    assert any(v["id"] == venue_id for v in list_all_res.json())

