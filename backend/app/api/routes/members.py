import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import get_optional_current_host
from backend.app.models.debt_record import DebtRecord
from backend.app.models.host import Host
from backend.app.models.member import Member
from backend.app.models.session_participant import SessionParticipant
from backend.app.schemas.debt import DebtRecordResponse
from backend.app.schemas.member import (
    MemberCreate,
    MemberDetailResponse,
    MemberResponse,
    MemberUpdate,
    SettleDebtRequest,
    SettleDebtResponse,
)

router = APIRouter(tags=["Members"])


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


@router.get(
    "/members",
    response_model=list[MemberResponse],
    summary="List frequent badminton roster members",
)
async def list_members(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
    search: str | None = Query(default=None, description="Search by name or phone"),
    active_only: bool = Query(default=True, description="Filter only active members"),
) -> list[Member]:
    """
    Returns list of members managed by the host with optional search and active status filters.
    """
    host_id = await _resolve_host_id(current_host, db)
    query = select(Member).where(Member.host_id == host_id)

    if active_only:
        query = query.where(Member.is_active.is_(True))

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Member.name.ilike(search_term),
                Member.phone.ilike(search_term),
            )
        )

    query = query.order_by(Member.name.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post(
    "/members",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new frequent player member",
)
async def create_member(
    member_in: MemberCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> Member:
    """
    Creates a new roster member associated with the current host.
    """
    host_id = await _resolve_host_id(current_host, db)

    member = Member(
        host_id=host_id,
        name=member_in.name.strip(),
        phone=member_in.phone.strip() if member_in.phone else None,
        gender=member_in.gender,
        default_note=member_in.default_note,
        total_debt=0.0,
        is_active=member_in.is_active,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.get(
    "/members/{member_id}",
    response_model=MemberDetailResponse,
    summary="Get member details with attendance and debt records",
)
async def get_member(
    member_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> MemberDetailResponse:
    """
    Returns member details including attendance count and debt ledger history.
    """
    host_id = await _resolve_host_id(current_host, db)

    member_res = await db.execute(
        select(Member).where(Member.id == member_id, Member.host_id == host_id)
    )
    member = member_res.scalars().first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    # Attendance count
    part_count_res = await db.execute(
        select(func.count(SessionParticipant.id)).where(
            SessionParticipant.member_id == member_id
        )
    )
    attended_sessions_count = part_count_res.scalar_one_or_none() or 0

    # Debt records
    debts_res = await db.execute(
        select(DebtRecord)
        .where(DebtRecord.member_id == member_id, DebtRecord.host_id == host_id)
        .order_by(DebtRecord.created_at.desc())
    )
    debt_records = list(debts_res.scalars().all())

    return MemberDetailResponse(
        id=member.id,
        host_id=member.host_id,
        name=member.name,
        phone=member.phone,
        gender=member.gender,
        default_note=member.default_note,
        total_debt=float(member.total_debt),
        is_active=member.is_active,
        created_at=member.created_at,
        updated_at=member.updated_at,
        attended_sessions_count=attended_sessions_count,
        debt_records=[DebtRecordResponse.model_validate(d) for d in debt_records],
    )


@router.put(
    "/members/{member_id}",
    response_model=MemberResponse,
    summary="Update member profile",
)
async def update_member(
    member_id: uuid.UUID,
    member_in: MemberUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> Member:
    """
    Updates profile fields for a roster member.
    """
    host_id = await _resolve_host_id(current_host, db)

    result = await db.execute(
        select(Member).where(Member.id == member_id, Member.host_id == host_id)
    )
    member = result.scalars().first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    update_data = member_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] is not None:
        update_data["name"] = update_data["name"].strip()
    if "phone" in update_data and update_data["phone"] is not None:
        update_data["phone"] = update_data["phone"].strip()

    for field, value in update_data.items():
        setattr(member, field, value)

    await db.commit()
    await db.refresh(member)
    return member


@router.delete(
    "/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a roster member",
)
async def delete_member(
    member_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> None:
    """
    Deletes a member record. Associated debt records are cascaded by foreign key.
    """
    host_id = await _resolve_host_id(current_host, db)

    result = await db.execute(
        select(Member).where(Member.id == member_id, Member.host_id == host_id)
    )
    member = result.scalars().first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    await db.delete(member)
    await db.commit()


@router.get(
    "/members/{member_id}/debts",
    response_model=list[DebtRecordResponse],
    summary="List debt records for a member",
)
async def list_member_debts(
    member_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[DebtRecord]:
    """
    Returns chronological debt records for a specific member.
    """
    host_id = await _resolve_host_id(current_host, db)

    # Check member exists
    member_res = await db.execute(
        select(Member).where(Member.id == member_id, Member.host_id == host_id)
    )
    if not member_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    query = (
        select(DebtRecord)
        .where(DebtRecord.member_id == member_id, DebtRecord.host_id == host_id)
    )
    if status_filter:
        query = query.where(DebtRecord.status == status_filter)

    query = query.order_by(DebtRecord.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post(
    "/members/{member_id}/settle",
    response_model=SettleDebtResponse,
    summary="Settle member debts using FIFO allocation",
)
async def settle_member_debt(
    member_id: uuid.UUID,
    settle_in: SettleDebtRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> SettleDebtResponse:
    """
    Applies payment amount across oldest unpaid/partially paid debt records using FIFO logic.
    Updates debt record statuses, settlement timestamps, and member net total debt balance.
    """
    host_id = await _resolve_host_id(current_host, db)

    member_res = await db.execute(
        select(Member).where(Member.id == member_id, Member.host_id == host_id)
    )
    member = member_res.scalars().first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    # Fetch unpaid or partially paid debts in chronological FIFO order
    unsettled_res = await db.execute(
        select(DebtRecord)
        .where(
            DebtRecord.member_id == member_id,
            DebtRecord.host_id == host_id,
            DebtRecord.status.in_(["unpaid", "partially_paid"]),
        )
        .order_by(DebtRecord.created_at.asc())
    )
    unsettled_debts = list(unsettled_res.scalars().all())

    payment_remaining = float(settle_in.amount)
    settled_records_count = 0
    now = datetime.now(timezone.utc)

    for debt in unsettled_debts:
        amount_owed = float(debt.amount_owed)
        amount_paid = float(debt.amount_paid)
        remaining_on_record = amount_owed - amount_paid

        if remaining_on_record <= 0:
            continue

        payment_to_apply = min(payment_remaining, remaining_on_record)
        debt.amount_paid = amount_paid + payment_to_apply
        payment_remaining -= payment_to_apply

        if debt.amount_paid >= amount_owed - 0.001:
            debt.status = "settled"
            debt.settled_at = now
        else:
            debt.status = "partially_paid"

        settled_records_count += 1

        if payment_remaining <= 0.001:
            break

    if settle_in.forgive_remainder:
        for debt in unsettled_debts:
            if debt.status in ["unpaid", "partially_paid"]:
                debt.status = "forgiven"
                debt.settled_at = now

    await db.flush()

    # Recalculate member total_debt from remaining unpaid/partially_paid records
    agg_res = await db.execute(
        select(
            func.coalesce(
                func.sum(DebtRecord.amount_owed - DebtRecord.amount_paid), 0.0
            )
        ).where(
            DebtRecord.member_id == member_id,
            DebtRecord.host_id == host_id,
            DebtRecord.status.in_(["unpaid", "partially_paid"]),
        )
    )
    new_total_debt = float(agg_res.scalar_one_or_none() or 0.0)
    member.total_debt = new_total_debt

    await db.commit()
    await db.refresh(member)

    return SettleDebtResponse(
        member_id=member.id,
        settled_amount=settle_in.amount,
        remaining_debt=new_total_debt,
        settled_records_count=settled_records_count,
        note=settle_in.note,
    )


@router.get(
    "/debt-records",
    response_model=list[DebtRecordResponse],
    summary="List host debt records with filters",
)
async def list_debt_records(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
    status_filter: str | None = Query(default=None, alias="status"),
    member_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[DebtRecord]:
    """
    Returns global debt records for current host filtered by status or member.
    """
    host_id = await _resolve_host_id(current_host, db)

    query = select(DebtRecord).where(DebtRecord.host_id == host_id)

    if status_filter:
        query = query.where(DebtRecord.status == status_filter)
    if member_id:
        query = query.where(DebtRecord.member_id == member_id)

    query = query.order_by(DebtRecord.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())
