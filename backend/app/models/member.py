import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, UUIDv7PKMixin

if TYPE_CHECKING:
    from backend.app.models.debt_record import DebtRecord
    from backend.app.models.host import Host
    from backend.app.models.session_participant import SessionParticipant


class Member(Base, UUIDv7PKMixin, TimestampMixin):
    """Frequent player roster member managed by a host."""

    __tablename__ = "members"

    host_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("hosts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)  # 'male' or 'female'
    default_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_debt: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    host: Mapped["Host"] = relationship("Host", back_populates="members")
    participants: Mapped[list["SessionParticipant"]] = relationship(
        "SessionParticipant", back_populates="member"
    )
    debt_records: Mapped[list["DebtRecord"]] = relationship(
        "DebtRecord", back_populates="member", cascade="all, delete-orphan"
    )
