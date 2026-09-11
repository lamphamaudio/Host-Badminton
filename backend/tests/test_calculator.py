from backend.app.schemas.session import EarlyLeaverInput, SessionCalculationRequest
from backend.app.services.calculator import calculate_session_split, round_up_to_1000


def test_round_up_to_1000():
    assert round_up_to_1000(35000.0) == 35000.0
    assert round_up_to_1000(35001.0) == 36000.0
    assert round_up_to_1000(35999.0) == 36000.0
    assert round_up_to_1000(100.0) == 1000.0
    assert round_up_to_1000(0.0) == 0.0
    assert round_up_to_1000(-500.0) == 0.0


def test_calculate_session_split_zero():
    req = SessionCalculationRequest(
        court_fee=0.0,
        shuttlecock_count=0,
        shuttlecock_unit_price=0.0,
        male_count=0,
        female_count=0,
        split_mode="even",
    )
    res = calculate_session_split(req)
    assert res.total_expenses == 0.0
    assert res.male_fee == 0.0
    assert res.female_fee == 0.0
    assert res.total_collected == 0.0


def test_calculate_session_split_even():
    req = SessionCalculationRequest(
        court_fee=200000.0,
        shuttlecock_count=8,
        shuttlecock_unit_price=20000.0,
        male_count=6,
        female_count=4,
        split_mode="even",
    )
    res = calculate_session_split(req)
    assert res.total_expenses == 360000.0
    assert res.total_participants == 10
    assert res.male_fee == 36000.0
    assert res.female_fee == 36000.0
    assert res.total_collected == 360000.0
    assert res.fund_buffer == 0.0


def test_calculate_session_split_uneven_round_up():
    req = SessionCalculationRequest(
        court_fee=205000.0,
        shuttlecock_count=8,
        shuttlecock_unit_price=20000.0,
        male_count=6,
        female_count=4,
        split_mode="even",
    )
    res = calculate_session_split(req)
    assert res.total_expenses == 365000.0
    assert res.male_fee == 37000.0
    assert res.female_fee == 37000.0
    assert res.total_collected == 370000.0
    assert res.fund_buffer == 5000.0


def test_calculate_session_split_female_discount():
    req = SessionCalculationRequest(
        court_fee=200000.0,
        shuttlecock_count=8,
        shuttlecock_unit_price=20000.0,
        male_count=6,
        female_count=4,
        split_mode="fixed_female_discount",
        female_discount=10000.0,
    )
    res = calculate_session_split(req)
    assert res.female_fee == 32000.0
    assert res.male_fee == 42000.0
    assert res.total_collected == 380000.0
    assert res.fund_buffer == 20000.0


def test_calculate_session_split_fixed_female():
    req = SessionCalculationRequest(
        court_fee=200000.0,
        shuttlecock_count=8,
        shuttlecock_unit_price=20000.0,
        male_count=6,
        female_count=4,
        split_mode="fixed_female",
        fixed_female_fee=30000.0,
    )
    res = calculate_session_split(req)
    assert res.female_fee == 30000.0
    assert res.male_fee == 40000.0
    assert res.total_collected == 360000.0


def test_calculate_session_split_multi_stage():
    req = SessionCalculationRequest(
        court_fee=200000.0,
        shuttlecock_count=8,
        shuttlecock_unit_price=20000.0,
        male_count=6,
        female_count=4,
        split_mode="multi_stage",
        early_leaver_config=EarlyLeaverInput(
            count=2,
            stage1_ratio=0.5,
            stage1_shuttlecocks=4,
        ),
    )
    res = calculate_session_split(req)
    assert res.early_fee == 18000.0
    assert res.stay_fee == 41000.0
    assert res.early_count == 2
    assert res.stay_count == 8
    assert res.total_collected == 364000.0
    assert res.fund_buffer == 4000.0
