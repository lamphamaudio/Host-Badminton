import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, UUIDv7PKMixin

if TYPE_CHECKING:
    from backend.app.models.host import Host
    from backend.app.models.session import Session


class Venue(Base, UUIDv7PKMixin, TimestampMixin):
    """Badminton court location/facility managed by a host."""

    __tablename__ = "venues"

    host_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("hosts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    court_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    default_court_rate: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    host: Mapped["Host"] = relationship("Host", back_populates="venues")
    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="venue")
