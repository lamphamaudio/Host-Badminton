import uuid
from datetime import date, time

import pytest
from pydantic import ValidationError

from backend.app.schemas import (
    DebtRecordCreate,
    DebtRecordResponse,
    DebtRecordUpdate,
    HostCreate,
    HostResponse,
    HostUpdate,
    MemberCreate,
    MemberResponse,
    MemberUpdate,
    SessionCreate,
    SessionDetailResponse,
    SessionExpenseCreate,
    SessionParticipantCreate,
    SessionUpdate,
    VenueCreate,
    VenueResponse,
    VenueUpdate,
)


def test_host_schema_validation():
    """Test HostCreate valid and invalid cases (AC-1)."""
    valid_host = HostCreate(
        full_name="Lâm Phạm",
        phone="0912345678",
        email="lam@example.com",
        bank_bin="970422",
        bank_name="MB Bank",
        bank_account_number="0912345678",
        bank_account_name="PHAM TUNG LAM",
    )
    assert valid_host.full_name == "Lâm Phạm"

    # Empty name should fail
    with pytest.raises(ValidationError):
        HostCreate(full_name="")

    # Invalid email format should fail
    with pytest.raises(ValidationError):
        HostCreate(full_name="Lâm Phạm", email="not-an-email")


def test_host_update_and_response_schemas():
    """Test HostUpdate partial edits and HostResponse model dump (AC-1)."""
    update_data = HostUpdate(bank_account_number="99998888")
    assert update_data.bank_account_number == "99998888"
    assert update_data.full_name is None

    host_dict = {
        "id": uuid.uuid4(),
        "full_name": "Nguyễn Host",
        "phone": "0900000000",
        "email": "host@test.vn",
        "bank_bin": "970436",
        "bank_name": "Vietcombank",
        "bank_account_number": "1010101010",
        "bank_account_name": "NGUYEN HOST",
        "created_at": "2026-09-10T10:00:00Z",
        "updated_at": "2026-09-10T10:00:00Z",
    }
    response = HostResponse.model_validate(host_dict)
    assert response.bank_name == "Vietcombank"
    assert response.bank_account_name == "NGUYEN HOST"


def test_venue_schema_validation():
    """Test VenueCreate valid and invalid cases (AC-2)."""
    valid_venue = VenueCreate(
        name="Sân Cầu Lông Tân Bình",
        address="123 Cộng Hòa",
        court_number="Sân 1, 2",
        default_court_rate=100000.0,
    )
    assert valid_venue.name == "Sân Cầu Lông Tân Bình"
    assert valid_venue.default_court_rate == 100000.0

    # Negative rate should fail
    with pytest.raises(ValidationError):
        VenueCreate(name="Sân Tân Bình", default_court_rate=-50000.0)


def test_venue_update_and_response_schemas():
    """Test VenueUpdate and VenueResponse schemas (AC-2)."""
    update = VenueUpdate(name="Sân Mới Đổi Tên", is_active=False)
    assert update.name == "Sân Mới Đổi Tên"
    assert update.is_active is False

    venue_dict = {
        "id": uuid.uuid4(),
        "host_id": uuid.uuid4(),
        "name": "Sân Cầu Lông Kỳ Hòa",
        "address": "238 3/2, Quận 10",
        "court_number": "Sân 5",
        "default_court_rate": 140000.0,
        "is_active": True,
        "created_at": "2026-09-10T10:00:00Z",
        "updated_at": "2026-09-10T10:00:00Z",
    }
    resp = VenueResponse.model_validate(venue_dict)
    assert resp.name == "Sân Cầu Lông Kỳ Hòa"
    assert resp.default_court_rate == 140000.0


def test_member_schema_validation():
    """Test MemberCreate validation (AC-3)."""
    valid_member = MemberCreate(
        name="Nguyễn Văn C",
        gender="male",
        phone="0909090909",
    )
    assert valid_member.gender == "male"

    # Invalid gender should fail
    with pytest.raises(ValidationError):
        MemberCreate(name="Nguyễn Văn C", gender="other")  # type: ignore[arg-type]


def test_member_update_and_response_schemas():
    """Test MemberUpdate and MemberResponse schemas (AC-3)."""
    update = MemberUpdate(gender="female", default_note="Đổi ca đánh")
    assert update.gender == "female"
    assert update.default_note == "Đổi ca đánh"

    member_dict = {
        "id": uuid.uuid4(),
        "host_id": uuid.uuid4(),
        "name": "Lê Văn D",
        "phone": "0911223344",
        "gender": "male",
        "default_note": "Cố định",
        "total_debt": 150000.0,
        "is_active": True,
        "created_at": "2026-09-10T10:00:00Z",
        "updated_at": "2026-09-10T10:00:00Z",
    }
    resp = MemberResponse.model_validate(member_dict)
    assert resp.name == "Lê Văn D"
    assert resp.total_debt == 150000.0


def test_session_and_expenses_schema_validation():
    """Test SessionCreate with nested expenses and participants (AC-4, AC-5, AC-6)."""
    valid_session = SessionCreate(
        session_date=date(2026, 9, 10),
        start_time=time(18, 0),
        court_fee=200000.0,
        shuttlecock_fee=80000.0,
        total_expenses=320000.0,
        gender_split_mode="fixed_female",
        fixed_female_fee=40000.0,
        is_multi_stage=True,
        stage1_cost=200000.0,
        stage2_cost=120000.0,
        expenses=[
            SessionExpenseCreate(
                category="drink",
                item_name="Revive",
                quantity=4,
                unit_price=10000,
                total_amount=40000,
            )
        ],
        participants=[
            SessionParticipantCreate(
                display_name="Bạn Nam 1",
                gender="male",
                play_stage="full",
                calculated_fee=70000.0,
            ),
            SessionParticipantCreate(
                display_name="Bạn Nữ 1",
                gender="female",
                play_stage="early_leaver",
                calculated_fee=40000.0,
            ),
        ],
    )

    assert valid_session.court_fee == 200000.0
    assert len(valid_session.expenses) == 1
    assert len(valid_session.participants) == 2


def test_session_update_and_response_schemas():
    """Test SessionUpdate and nested response serialization (AC-4, AC-5, AC-6)."""
    update = SessionUpdate(status="completed", vietqr_memo="DON DEP SAN")
    assert update.status == "completed"

    session_id = uuid.uuid4()
    host_id = uuid.uuid4()
    session_dict = {
        "id": session_id,
        "host_id": host_id,
        "venue_id": None,
        "session_date": "2026-09-10",
        "start_time": "19:00:00",
        "end_time": "21:00:00",
        "status": "active",
        "court_fee": 300000.0,
        "shuttlecock_fee": 120000.0,
        "shuttlecock_count": 6,
        "shuttlecock_unit_price": 20000.0,
        "total_expenses": 420000.0,
        "gender_split_mode": "equal",
        "fixed_female_fee": None,
        "fixed_male_fee": None,
        "is_multi_stage": False,
        "stage1_cost": 0.0,
        "stage2_cost": 0.0,
        "bank_bin": "970422",
        "bank_account_number": "0901234567",
        "bank_account_name": "NGUYEN VAN A",
        "vietqr_memo": "CAULONG 20260910",
        "note": "Ghi chú buổi đánh",
        "created_at": "2026-09-10T10:00:00Z",
        "updated_at": "2026-09-10T10:00:00Z",
        "expenses": [
            {
                "id": uuid.uuid4(),
                "session_id": session_id,
                "category": "shuttlecock",
                "item_name": "Vina Star",
                "quantity": 2.0,
                "unit_price": 60000.0,
                "total_amount": 120000.0,
                "created_at": "2026-09-10T10:00:00Z",
            }
        ],
        "participants": [
            {
                "id": uuid.uuid4(),
                "session_id": session_id,
                "member_id": None,
                "display_name": "Khách A",
                "gender": "male",
                "play_stage": "full",
                "custom_fee_override": None,
                "calculated_fee": 70000.0,
                "is_paid": True,
                "paid_amount": 70000.0,
                "payment_method": "vietqr",
                "paid_at": "2026-09-10T21:05:00Z",
                "note": None,
                "created_at": "2026-09-10T10:00:00Z",
                "updated_at": "2026-09-10T10:00:00Z",
            }
        ],
    }
    resp = SessionDetailResponse.model_validate(session_dict)
    assert resp.court_fee == 300000.0
    assert len(resp.expenses) == 1
    assert len(resp.participants) == 1
    assert resp.participants[0].is_paid is True
    assert resp.participants[0].payment_method == "vietqr"



def test_debt_record_schema_validation():
    """Test DebtRecordCreate validation (AC-7)."""
    member_id = uuid.uuid4()
    valid_debt = DebtRecordCreate(
        member_id=member_id,
        amount_owed=50000.0,
        status="unpaid",
    )
    assert valid_debt.amount_owed == 50000.0

    # Negative or zero amount owed should fail
    with pytest.raises(ValidationError):
        DebtRecordCreate(member_id=member_id, amount_owed=0)


def test_debt_record_update_and_response_schemas():
    """Test DebtRecordUpdate and DebtRecordResponse (AC-7)."""
    update = DebtRecordUpdate(amount_paid=50000.0, status="settled", note="Đã chuyển khoản VietQR")
    assert update.amount_paid == 50000.0
    assert update.status == "settled"

    debt_dict = {
        "id": uuid.uuid4(),
        "host_id": uuid.uuid4(),
        "member_id": uuid.uuid4(),
        "session_id": None,
        "amount_owed": 80000.0,
        "amount_paid": 40000.0,
        "status": "partially_paid",
        "settled_at": None,
        "note": "Trả trước một nửa",
        "created_at": "2026-09-10T10:00:00Z",
        "updated_at": "2026-09-10T10:00:00Z",
    }
    resp = DebtRecordResponse.model_validate(debt_dict)
    assert resp.status == "partially_paid"
    assert resp.amount_owed == 80000.0
    assert resp.amount_paid == 40000.0

