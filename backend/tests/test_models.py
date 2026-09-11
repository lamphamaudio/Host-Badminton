import time as time_module
import uuid
from datetime import date, time

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import Base
from backend.app.core.uuid7 import uuid7
from backend.app.models.debt_record import DebtRecord
from backend.app.models.host import Host
from backend.app.models.member import Member
from backend.app.models.session import Session
from backend.app.models.session_expense import SessionExpense
from backend.app.models.session_participant import SessionParticipant
from backend.app.models.venue import Venue


def test_uuid7_generation_and_ordering():
    """Verify UUIDv7 generates valid RFC 9562 UUIDs with time ordering."""
    u1 = uuid7()
    time_module.sleep(0.002)
    u2 = uuid7()

    assert isinstance(u1, uuid.UUID)
    assert isinstance(u2, uuid.UUID)
    assert u1.version == 7
    assert u2.version == 7
    # UUIDv7 string comparison preserves chronological order
    assert str(u1) < str(u2)


@pytest_asyncio.fixture
async def async_test_session():
    """Create an in-memory SQLite database session for model testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_create_host_and_relationships(async_test_session: AsyncSession):
    """Test creating Host with associated Venues, Members, and Sessions."""
    host = Host(
        full_name="Nguyễn Văn A",
        phone="0901234567",
        email="host@example.com",
        bank_bin="970422",
        bank_name="MB Bank",
        bank_account_number="0901234567",
        bank_account_name="NGUYEN VAN A",
    )
    async_test_session.add(host)
    await async_test_session.commit()
    await async_test_session.refresh(host)

    assert host.id is not None
    assert host.id.version == 7
    assert host.full_name == "Nguyễn Văn A"

    # Create Venue
    venue = Venue(
        host_id=host.id,
        name="Sân Cầu Lông Viettel",
        address="158 Hoàng Hoa Thám, Tân Bình",
        court_number="Sân 3",
        default_court_rate=120000.0,
    )
    async_test_session.add(venue)
    await async_test_session.commit()
    await async_test_session.refresh(venue)

    assert venue.name == "Sân Cầu Lông Viettel"
    assert venue.host_id == host.id

    # Create Member
    member = Member(
        host_id=host.id,
        name="Trần Thị B",
        phone="0987654321",
        gender="female",
        default_note="Thành viên cố định thứ 3-5",
    )
    async_test_session.add(member)
    await async_test_session.commit()
    await async_test_session.refresh(member)

    assert member.name == "Trần Thị B"
    assert member.gender == "female"

    # Create Session with expenses and participants
    session_match = Session(
        host_id=host.id,
        venue_id=venue.id,
        session_date=date(2026, 9, 10),
        start_time=time(18, 0),
        end_time=time(20, 0),
        status="active",
        court_fee=240000.0,
        shuttlecock_fee=100000.0,
        shuttlecock_count=5,
        shuttlecock_unit_price=20000.0,
        total_expenses=380000.0,
        gender_split_mode="equal",
        bank_bin=host.bank_bin,
        bank_account_number=host.bank_account_number,
        bank_account_name=host.bank_account_name,
        vietqr_memo="CAULONG 20260910",
    )
    async_test_session.add(session_match)
    await async_test_session.commit()
    await async_test_session.refresh(session_match)

    assert session_match.status == "active"
    assert session_match.bank_account_number == "0901234567"

    # Add Expense Item
    expense = SessionExpense(
        session_id=session_match.id,
        category="drink",
        item_name="Revive Chanh Muối",
        quantity=4.0,
        unit_price=10000.0,
        total_amount=40000.0,
    )
    async_test_session.add(expense)

    # Add Participant
    participant = SessionParticipant(
        session_id=session_match.id,
        member_id=member.id,
        display_name="Trần Thị B",
        gender="female",
        play_stage="full",
        calculated_fee=65000.0,
        is_paid=False,
    )
    async_test_session.add(participant)

    # Add Debt Record
    debt = DebtRecord(
        host_id=host.id,
        member_id=member.id,
        session_id=session_match.id,
        amount_owed=65000.0,
        amount_paid=0.0,
        status="unpaid",
    )
    async_test_session.add(debt)

    await async_test_session.commit()
    await async_test_session.refresh(expense)
    await async_test_session.refresh(participant)
    await async_test_session.refresh(debt)

    assert expense.item_name == "Revive Chanh Muối"
    assert participant.calculated_fee == 65000.0
    assert debt.status == "unpaid"


@pytest.mark.asyncio
async def test_cascade_delete_host(async_test_session: AsyncSession):
    """Verify deleting a Host cascades to its child records."""
    host = Host(full_name="Host X")
    async_test_session.add(host)
    await async_test_session.commit()
    await async_test_session.refresh(host)

    venue = Venue(host_id=host.id, name="Sân Test")
    member = Member(host_id=host.id, name="Member Test", gender="male")
    async_test_session.add_all([venue, member])
    await async_test_session.commit()

    # Delete host
    await async_test_session.delete(host)
    await async_test_session.commit()

    # Verify venue and member are deleted
    v_check = await async_test_session.get(Venue, venue.id)
    m_check = await async_test_session.get(Member, member.id)
    assert v_check is None
    assert m_check is None


@pytest.mark.asyncio
async def test_venue_and_member_set_null_on_delete(async_test_session: AsyncSession):
    """Verify deleting a Venue or Member sets session foreign keys to NULL (AC-8)."""
    host = Host(full_name="Host Test SetNull")
    async_test_session.add(host)
    await async_test_session.commit()
    await async_test_session.refresh(host)

    venue = Venue(host_id=host.id, name="Sân Xóa Thử")
    member = Member(host_id=host.id, name="Member Xóa Thử", gender="male")
    async_test_session.add_all([venue, member])
    await async_test_session.commit()
    await async_test_session.refresh(venue)
    await async_test_session.refresh(member)

    session_match = Session(
        host_id=host.id,
        venue_id=venue.id,
        session_date=date(2026, 9, 11),
        status="completed",
        court_fee=100000.0,
    )
    async_test_session.add(session_match)
    await async_test_session.commit()
    await async_test_session.refresh(session_match)

    participant = SessionParticipant(
        session_id=session_match.id,
        member_id=member.id,
        display_name="Member Xóa Thử",
        gender="male",
        calculated_fee=50000.0,
    )
    async_test_session.add(participant)
    await async_test_session.commit()
    await async_test_session.refresh(participant)

    # Delete Venue and Member
    await async_test_session.delete(venue)
    await async_test_session.delete(member)
    await async_test_session.commit()

    # Re-fetch session and participant
    refreshed_session = await async_test_session.get(Session, session_match.id)
    refreshed_participant = await async_test_session.get(SessionParticipant, participant.id)

    assert refreshed_session is not None
    assert refreshed_session.venue_id is None
    assert refreshed_participant is not None
    assert refreshed_participant.member_id is None


@pytest.mark.asyncio
async def test_session_cascade_expenses_and_participants(async_test_session: AsyncSession):
    """Verify deleting a Session cascades to its expenses and participants.

    Covers: AC-4, AC-5, AC-6, AC-8.
    """
    host = Host(full_name="Host Cascade Test")
    async_test_session.add(host)
    await async_test_session.commit()
    await async_test_session.refresh(host)

    session_match = Session(
        host_id=host.id,
        session_date=date(2026, 9, 12),
        status="active",
        court_fee=150000.0,
    )
    async_test_session.add(session_match)
    await async_test_session.commit()
    await async_test_session.refresh(session_match)

    expense = SessionExpense(
        session_id=session_match.id,
        category="shuttlecock",
        item_name="Hải Yến",
        unit_price=250000.0,
        total_amount=250000.0,
    )
    participant = SessionParticipant(
        session_id=session_match.id,
        display_name="Khách Vãng Lai",
        gender="male",
        calculated_fee=50000.0,
    )
    async_test_session.add_all([expense, participant])
    await async_test_session.commit()
    await async_test_session.refresh(expense)
    await async_test_session.refresh(participant)

    # Delete Session
    await async_test_session.delete(session_match)
    await async_test_session.commit()

    # Expenses and participants should be cascaded
    exp_check = await async_test_session.get(SessionExpense, expense.id)
    part_check = await async_test_session.get(SessionParticipant, participant.id)
    assert exp_check is None
    assert part_check is None


def test_uuid7_sequential_monotonicity():
    """Verify sequential generation of UUIDv7s maintains monotonic order (AC-8)."""
    uuids = []
    for _ in range(5):
        uuids.append(uuid7())
        time_module.sleep(0.002)

    for i in range(len(uuids) - 1):
        assert str(uuids[i]) < str(uuids[i + 1])


