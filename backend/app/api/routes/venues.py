import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import get_optional_current_host
from backend.app.models.host import Host
from backend.app.models.venue import Venue
from backend.app.schemas.venue import VenueCreate, VenueResponse, VenueUpdate

router = APIRouter(prefix="/venues", tags=["Venues"])


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
    "",
    response_model=list[VenueResponse],
    summary="List badminton court venues",
)
async def list_venues(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
    include_inactive: bool = Query(default=False, description="Include deactivated venues"),
) -> list[Venue]:
    """
    Returns list of court venues managed by host, filtered by active status by default.
    """
    host_id = await _resolve_host_id(current_host, db)
    query = (
        select(Venue)
        .where(Venue.host_id == host_id)
        .order_by(Venue.name.asc())
    )
    if not include_inactive:
        query = query.where(Venue.is_active.is_(True))
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post(
    "",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new badminton court venue",
)
async def create_venue(
    venue_in: VenueCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> Venue:
    """
    Creates a new venue profile with default rates and court identifiers.
    """
    host_id = await _resolve_host_id(current_host, db)

    venue = Venue(
        host_id=host_id,
        name=venue_in.name,
        address=venue_in.address,
        court_number=venue_in.court_number,
        default_court_rate=venue_in.default_court_rate,
        is_active=venue_in.is_active,
    )
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    return venue


@router.get(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Get venue details by ID",
)
async def get_venue(
    venue_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> Venue:
    host_id = await _resolve_host_id(current_host, db)
    result = await db.execute(
        select(Venue).where(Venue.id == venue_id, Venue.host_id == host_id)
    )
    venue = result.scalars().first()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")
    return venue


@router.put(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Update venue details",
)
async def update_venue(
    venue_id: uuid.UUID,
    venue_in: VenueUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> Venue:
    host_id = await _resolve_host_id(current_host, db)
    result = await db.execute(
        select(Venue).where(Venue.id == venue_id, Venue.host_id == host_id)
    )
    venue = result.scalars().first()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")

    update_data = venue_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(venue, field, value)

    await db.commit()
    await db.refresh(venue)
    return venue


@router.delete(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Deactivate a venue (soft delete)",
)
async def delete_venue(
    venue_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_host: Annotated[Host | None, Depends(get_optional_current_host)] = None,
) -> Venue:
    host_id = await _resolve_host_id(current_host, db)
    result = await db.execute(
        select(Venue).where(Venue.id == venue_id, Venue.host_id == host_id)
    )
    venue = result.scalars().first()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")

    venue.is_active = False
    await db.commit()
    await db.refresh(venue)
    return venue

