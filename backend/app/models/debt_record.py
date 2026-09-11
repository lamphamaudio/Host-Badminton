import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, UUIDv7PKMixin

if TYPE_CHECKING:
    from backend.app.models.host import Host
    from backend.app.models.member import Member
    from backend.app.models.session import Session


class DebtRecord(Base, UUIDv7PKMixin, TimestampMixin):
    """Debt ledger tracking outstanding and settled balances between host and member."""

    __tablename__ = "debt_records"

    host_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("hosts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    amount_owed: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    amount_paid: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    # status: unpaid, partially_paid, settled, forgiven
    status: Mapped[str] = mapped_column(String(20), default="unpaid", nullable=False)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    host: Mapped["Host"] = relationship("Host", back_populates="debt_records")
    member: Mapped["Member"] = relationship("Member", back_populates="debt_records")
    session: Mapped[Optional["Session"]] = relationship("Session", back_populates="debt_records")
