import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app


@pytest.mark.asyncio
async def test_calculate_session_endpoint_even():
    payload = {
        "court_fee": 200000.0,
        "shuttlecock_count": 8,
        "shuttlecock_unit_price": 20000.0,
        "male_count": 6,
        "female_count": 4,
        "split_mode": "even",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/sessions/calculate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["total_expenses"] == 360000.0
    assert data["total_participants"] == 10
    assert data["male_fee"] == 36000.0
    assert data["female_fee"] == 36000.0
    assert data["total_collected"] == 360000.0
    assert data["fund_buffer"] == 0.0


@pytest.mark.asyncio
async def test_calculate_session_endpoint_female_discount():
    payload = {
        "court_fee": 200000.0,
        "shuttlecock_count": 8,
        "shuttlecock_unit_price": 20000.0,
        "male_count": 6,
        "female_count": 4,
        "split_mode": "fixed_female_discount",
        "female_discount": 10000.0,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/sessions/calculate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["female_fee"] == 32000.0
    assert data["male_fee"] == 42000.0
    assert data["total_collected"] == 380000.0
    assert data["fund_buffer"] == 20000.0


@pytest.mark.asyncio
async def test_calculate_session_endpoint_multi_stage():
    payload = {
        "court_fee": 200000.0,
        "shuttlecock_count": 8,
        "shuttlecock_unit_price": 20000.0,
        "male_count": 6,
        "female_count": 4,
        "split_mode": "multi_stage",
        "early_leaver_config": {
            "count": 2,
            "stage1_ratio": 0.5,
            "stage1_shuttlecocks": 4,
        },
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/sessions/calculate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["early_fee"] == 18000.0
    assert data["stay_fee"] == 41000.0
    assert data["early_count"] == 2
    assert data["stay_count"] == 8
    assert data["total_collected"] == 364000.0


@pytest.mark.asyncio
async def test_get_banks_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/banks")

    assert response.status_code == 200
    banks = response.json()
    assert len(banks) >= 15
    bins = [b["bin"] for b in banks]
    assert "970422" in bins  # MB Bank
    assert "970436" in bins  # Vietcombank
    assert "970407" in bins  # Techcombank
