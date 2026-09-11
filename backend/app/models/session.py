import uuid
from datetime import date, time
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text, Time, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, UUIDv7PKMixin

if TYPE_CHECKING:
    from backend.app.models.debt_record import DebtRecord
    from backend.app.models.host import Host
    from backend.app.models.session_expense import SessionExpense
    from backend.app.models.session_participant import SessionParticipant
    from backend.app.models.venue import Venue


class Session(Base, UUIDv7PKMixin, TimestampMixin):
    """Badminton session event, financial calculation and payment snapshot."""

    __tablename__ = "sessions"

    host_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("hosts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    venue_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("venues.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    # Status: draft, active, completed, cancelled
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)

    # Court & Shuttlecock fees
    court_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    shuttlecock_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    shuttlecock_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    shuttlecock_unit_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    total_expenses: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)

    # Gender Split Rules: equal, fixed_female, fixed_male
    gender_split_mode: Mapped[str] = mapped_column(String(20), default="equal", nullable=False)
    fixed_female_fee: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    fixed_male_fee: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Multi-stage Cost Pools
    is_multi_stage: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stage1_cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    stage2_cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)

    # Host Bank Snapshot (immutable for this bill)
    bank_bin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_account_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vietqr_memo: Mapped[str | None] = mapped_column(String(255), nullable=True)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    host: Mapped["Host"] = relationship("Host", back_populates="sessions")
    venue: Mapped[Optional["Venue"]] = relationship("Venue", back_populates="sessions")
    expenses: Mapped[list["SessionExpense"]] = relationship(
        "SessionExpense", back_populates="session", cascade="all, delete-orphan"
    )
    participants: Mapped[list["SessionParticipant"]] = relationship(
        "SessionParticipant", back_populates="session", cascade="all, delete-orphan"
    )
    debt_records: Mapped[list["DebtRecord"]] = relationship("DebtRecord", back_populates="session")
