import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.core.security import get_optional_current_host
from backend.app.models.debt_record import DebtRecord
from backend.app.models.host import Host
from backend.app.models.member import Member
from backend.app.models.session import Session
from backend.app.models.session_expense import SessionExpense
from backend.app.models.session_participant import SessionParticipant
from backend.app.schemas.session import (
    SessionCalculationRequest,
    SessionCalculationResponse,
    SessionCreate,
    SessionDetailResponse,
    SessionListResponse,
    SessionSummaryResponse,
)
from backend.app.services.calculator import calculate_session_split

router = APIRouter(prefix="/sessions", tags=["Sessions"])


async def _get_or_create_default_host(db: AsyncSession) -> uuid.UUID:
    """Helper to retrieve or initialize default guest host in pre-auth mode."""
    result = await db.execute(select(Host).limit(1))
    host = result.scalars().first()
    if not host:
        host = Host(
            full_name="Guest Host",
            is_active=True,
        )
        db.add(host)
        await db.flush()
    return host.id


async def _resolve_host_id(
    current_host: Host | None,
    db: AsyncSession,
) -> uuid.UUID:
    if current_host:
        return current_host.id
    return await _get_or_create_default_host(db)


@router.post(
    "/calculate",
    response_model=SessionCalculationResponse,
    summary="Validate and calculate badminton session expense split",
)
async def calculate_session(
    request: SessionCalculationRequest,
) -> SessionCalculationResponse:
    """
    Pure calculation endpoint providing real-time calculation validation
    for even split, female discounts, fixed fees, and two-stage early leaver splits.
    """
    return calculate_session_split(request)


@router.get(
    "",
    response_model=SessionListResponse,
    summary="List badminton session history with filters and summary stats",
)
async def list_sessions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    venue_id: uuid.UUID | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
) -> SessionListResponse:
    """
    Returns paginated historical sessions with venue name, participant counts,
    and aggregated summary statistics.
    """
    host_id = await _resolve_host_id(current_host, db)

    # Build filter conditions
    conditions = [Session.host_id == host_id]
    if start_date:
        conditions.append(Session.session_date >= start_date)
    if end_date:
        conditions.append(Session.session_date <= end_date)
    if venue_id:
        conditions.append(Session.venue_id == venue_id)
    if status_filter:
        conditions.append(Session.status == status_filter)

    # Aggregates query
    agg_query = select(
        func.count(Session.id).label("total_count"),
        func.coalesce(func.sum(Session.total_expenses), 0.0).label("total_revenue"),
    ).where(*conditions)
    agg_res = await db.execute(agg_query)
    agg_row = agg_res.first()
    total_count = agg_row.total_count if agg_row else 0
    total_revenue = float(agg_row.total_revenue) if agg_row else 0.0

    # Total participants query across filtered sessions
    part_agg_query = (
        select(func.count(SessionParticipant.id))
        .join(Session, SessionParticipant.session_id == Session.id)
        .where(*conditions)
    )
    part_res = await db.execute(part_agg_query)
    total_participants = part_res.scalar_one_or_none() or 0

    # Paginated items query
    items_query = (
        select(Session)
        .where(*conditions)
        .options(
            selectinload(Session.venue),
            selectinload(Session.participants),
        )
        .order_by(Session.session_date.desc(), Session.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(items_query)
    sessions = result.scalars().all()

    summary_items: list[SessionSummaryResponse] = []
    for s in sessions:
        p_count = len(s.participants)
        paid_count = sum(1 for p in s.participants if p.is_paid)
        summary_items.append(
            SessionSummaryResponse(
                id=s.id,
                host_id=s.host_id,
                venue_id=s.venue_id,
                venue_name=s.venue.name if s.venue else None,
                session_date=s.session_date,
                start_time=s.start_time,
                end_time=s.end_time,
                status=s.status,
                court_fee=s.court_fee,
                shuttlecock_fee=s.shuttlecock_fee,
                shuttlecock_count=s.shuttlecock_count,
                shuttlecock_unit_price=s.shuttlecock_unit_price,
                total_expenses=s.total_expenses,
                gender_split_mode=s.gender_split_mode,
                fixed_female_fee=s.fixed_female_fee,
                fixed_male_fee=s.fixed_male_fee,
                is_multi_stage=s.is_multi_stage,
                stage1_cost=s.stage1_cost,
                stage2_cost=s.stage2_cost,
                bank_bin=s.bank_bin,
                bank_account_number=s.bank_account_number,
                bank_account_name=s.bank_account_name,
                vietqr_memo=s.vietqr_memo,
                note=s.note,
                participant_count=p_count,
                paid_count=paid_count,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
        )

    return SessionListResponse(
        items=summary_items,
        total_count=total_count,
        total_revenue=total_revenue,
        total_participants=total_participants,
        limit=limit,
        offset=offset,
    )


@router.post(
    "",
    response_model=SessionDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create and persist a badminton calculation session",
)
async def create_session(
    session_in: SessionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> Session:
    """
    Creates a new session in the database with expense line items and player participants.
    """
    host_id = await _resolve_host_id(current_host, db)

    db_session = Session(
        host_id=host_id,
        venue_id=session_in.venue_id,
        session_date=session_in.session_date,
        start_time=session_in.start_time,
        end_time=session_in.end_time,
        status=session_in.status,
        court_fee=session_in.court_fee,
        shuttlecock_fee=session_in.shuttlecock_fee,
        shuttlecock_count=session_in.shuttlecock_count,
        shuttlecock_unit_price=session_in.shuttlecock_unit_price,
        total_expenses=session_in.total_expenses,
        gender_split_mode=session_in.gender_split_mode,
        fixed_female_fee=session_in.fixed_female_fee,
        fixed_male_fee=session_in.fixed_male_fee,
        is_multi_stage=session_in.is_multi_stage,
        stage1_cost=session_in.stage1_cost,
        stage2_cost=session_in.stage2_cost,
        bank_bin=session_in.bank_bin,
        bank_account_number=session_in.bank_account_number,
        bank_account_name=session_in.bank_account_name,
        vietqr_memo=session_in.vietqr_memo,
        note=session_in.note,
    )
    db.add(db_session)
    await db.flush()

    for exp in session_in.expenses:
        db_exp = SessionExpense(
            session_id=db_session.id,
            category=exp.category,
            item_name=exp.item_name,
            quantity=exp.quantity,
            unit_price=exp.unit_price,
            total_amount=exp.total_amount,
        )
        db.add(db_exp)

    for part in session_in.participants:
        db_part = SessionParticipant(
            session_id=db_session.id,
            member_id=part.member_id,
            display_name=part.display_name,
            gender=part.gender,
            play_stage=part.play_stage,
            custom_fee_override=part.custom_fee_override,
            calculated_fee=part.calculated_fee,
            is_paid=part.is_paid,
            paid_amount=part.paid_amount,
            payment_method=part.payment_method,
            paid_at=part.paid_at,
            note=part.note,
        )
        db.add(db_part)

        # Automatically create DebtRecord if participant has a member profile and is unpaid
        unpaid_fee = (
            float(part.calculated_fee) - float(part.paid_amount or 0.0)
            if part.is_paid
            else float(part.calculated_fee)
        )
        if part.member_id is not None and not part.is_paid and unpaid_fee > 0.001:
            debt_note = f"Phiên chơi ngày {db_session.session_date}"
            if part.note:
                debt_note += f" - {part.note}"
            db_debt = DebtRecord(
                host_id=host_id,
                member_id=part.member_id,
                session_id=db_session.id,
                amount_owed=unpaid_fee,
                amount_paid=0.0,
                status="unpaid",
                note=debt_note,
            )
            db.add(db_debt)

            # Update member total debt
            mem_res = await db.execute(
                select(Member).where(Member.id == part.member_id, Member.host_id == host_id)
            )
            member = mem_res.scalars().first()
            if member:
                member.total_debt = float(member.total_debt) + unpaid_fee

    await db.commit()

    # Reload with relationships
    query = (
        select(Session)
        .where(Session.id == db_session.id, Session.host_id == host_id)
        .options(
            selectinload(Session.expenses),
            selectinload(Session.participants),
            selectinload(Session.venue),
        )
    )
    result = await db.execute(query)
    created = result.scalars().first()
    if not created:
        raise HTTPException(status_code=404, detail="Created session not found")
    return created


@router.get(
    "/{session_id}",
    response_model=SessionDetailResponse,
    summary="Get session details by ID",
)
async def get_session(
    session_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> Session:
    host_id = await _resolve_host_id(current_host, db)
    query = (
        select(Session)
        .where(Session.id == session_id, Session.host_id == host_id)
        .options(
            selectinload(Session.expenses),
            selectinload(Session.participants),
            selectinload(Session.venue),
        )
    )
    result = await db.execute(query)
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a session record",
)
async def delete_session(
    session_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> None:
    host_id = await _resolve_host_id(current_host, db)
    query = select(Session).where(Session.id == session_id, Session.host_id == host_id)
    result = await db.execute(query)
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()


