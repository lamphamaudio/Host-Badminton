from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, UUIDv7PKMixin

if TYPE_CHECKING:
    from backend.app.models.debt_record import DebtRecord
    from backend.app.models.member import Member
    from backend.app.models.refresh_token import RefreshToken
    from backend.app.models.session import Session
    from backend.app.models.venue import Venue


class Host(Base, UUIDv7PKMixin, TimestampMixin):
    """Host/Organizer user profile and banking details."""

    __tablename__ = "hosts"

    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    google_sub: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=sa.text("true"), nullable=False
    )

    # VietQR Banking details
    bank_bin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_account_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="host", cascade="all, delete-orphan"
    )
    venues: Mapped[list["Venue"]] = relationship(
        "Venue", back_populates="host", cascade="all, delete-orphan"
    )
    members: Mapped[list["Member"]] = relationship(
        "Member", back_populates="host", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="host", cascade="all, delete-orphan"
    )
    debt_records: Mapped[list["DebtRecord"]] = relationship(
        "DebtRecord", back_populates="host", cascade="all, delete-orphan"
    )
