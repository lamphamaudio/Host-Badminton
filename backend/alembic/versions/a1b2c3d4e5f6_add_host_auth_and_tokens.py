"""add_host_auth_and_tokens

Revision ID: a1b2c3d4e5f6
Revises: 35540f3587f7
Create Date: 2026-09-10 16:20:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "35540f3587f7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Update Hosts Table
    op.add_column("hosts", sa.Column("avatar_url", sa.String(length=500), nullable=True))
    op.add_column(
        "hosts",
        sa.Column("google_sub", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "hosts",
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.create_index("ix_hosts_google_sub", "hosts", ["google_sub"], unique=True)

    # 2. Refresh Tokens Table
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("host_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["host_id"], ["hosts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_tokens_id", "refresh_tokens", ["id"])
    op.create_index("ix_refresh_tokens_host_id", "refresh_tokens", ["host_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)

    # 3. Phone OTPs Table
    op.create_table(
        "phone_otps",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_used", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_phone_otps_id", "phone_otps", ["id"])
    op.create_index("ix_phone_otps_phone", "phone_otps", ["phone"])


def downgrade() -> None:
    op.drop_table("phone_otps")
    op.drop_table("refresh_tokens")
    op.drop_index("ix_hosts_google_sub", table_name="hosts")
    op.drop_column("hosts", "is_active")
    op.drop_column("hosts", "google_sub")
    op.drop_column("hosts", "avatar_url")
