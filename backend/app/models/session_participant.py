import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, UUIDv7PKMixin

if TYPE_CHECKING:
    from backend.app.models.member import Member
    from backend.app.models.session import Session


class SessionParticipant(Base, UUIDv7PKMixin, TimestampMixin):
    """Player participant in a badminton session with assigned fees and payment status."""

    __tablename__ = "session_participants"

    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    # play_stage: full, early_leaver, stayer, custom
    play_stage: Mapped[str] = mapped_column(String(20), default="full", nullable=False)

    custom_fee_override: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    calculated_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)

    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    paid_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    # payment_method: vietqr, cash, transfer, other
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="participants")
    member: Mapped[Optional["Member"]] = relationship("Member", back_populates="participants")
