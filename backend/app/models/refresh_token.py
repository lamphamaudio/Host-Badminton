import uuid
from datetime import datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import UUIDv7PKMixin

if TYPE_CHECKING:
    from backend.app.models.host import Host


class RefreshToken(Base, UUIDv7PKMixin):
    """Stores hashed long lived refresh tokens for host sessions."""

    __tablename__ = "refresh_tokens"

    host_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(), ForeignKey("hosts.id", ondelete="CASCADE"), index=True, nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    host: Mapped["Host"] = relationship("Host", back_populates="refresh_tokens")
