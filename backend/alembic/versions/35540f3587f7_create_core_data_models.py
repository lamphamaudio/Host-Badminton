"""create_core_data_models

Revision ID: 35540f3587f7
Revises:
Create Date: 2026-09-09 17:42:52.649874

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "35540f3587f7"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Hosts Table
    op.create_table(
        "hosts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("bank_bin", sa.String(length=20), nullable=True),
        sa.Column("bank_name", sa.String(length=100), nullable=True),
        sa.Column("bank_account_number", sa.String(length=50), nullable=True),
        sa.Column("bank_account_name", sa.String(length=100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_hosts_id", "hosts", ["id"])
    op.create_index("ix_hosts_phone", "hosts", ["phone"], unique=True)
    op.create_index("ix_hosts_email", "hosts", ["email"], unique=True)

    # 2. Venues Table
    op.create_table(
        "venues",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("host_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("court_number", sa.String(length=50), nullable=True),
        sa.Column("default_court_rate", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["host_id"], ["hosts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_venues_id", "venues", ["id"])
    op.create_index("ix_venues_host_id", "venues", ["host_id"])

    # 3. Members Table
    op.create_table(
        "members",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("host_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("gender", sa.String(length=10), nullable=False),
        sa.Column("default_note", sa.Text(), nullable=True),
        sa.Column(
            "total_debt",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["host_id"], ["hosts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_members_id", "members", ["id"])
    op.create_index("ix_members_host_id", "members", ["host_id"])

    # 4. Sessions Table
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("host_id", sa.Uuid(), nullable=False),
        sa.Column("venue_id", sa.Uuid(), nullable=True),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="draft", nullable=False),
        sa.Column(
            "court_fee",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column(
            "shuttlecock_fee",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column("shuttlecock_count", sa.Integer(), nullable=True),
        sa.Column("shuttlecock_unit_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column(
            "total_expenses",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column(
            "gender_split_mode",
            sa.String(length=20),
            server_default="equal",
            nullable=False,
        ),
        sa.Column("fixed_female_fee", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("fixed_male_fee", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column(
            "is_multi_stage",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "stage1_cost",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column(
            "stage2_cost",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column("bank_bin", sa.String(length=20), nullable=True),
        sa.Column("bank_account_number", sa.String(length=50), nullable=True),
        sa.Column("bank_account_name", sa.String(length=100), nullable=True),
        sa.Column("vietqr_memo", sa.String(length=255), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["host_id"], ["hosts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sessions_id", "sessions", ["id"])
    op.create_index("ix_sessions_host_id", "sessions", ["host_id"])
    op.create_index("ix_sessions_venue_id", "sessions", ["venue_id"])

    # 5. Session Expenses Table
    op.create_table(
        "session_expenses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("item_name", sa.String(length=100), nullable=False),
        sa.Column(
            "quantity",
            sa.Numeric(precision=8, scale=2),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_session_expenses_id", "session_expenses", ["id"])
    op.create_index("ix_session_expenses_session_id", "session_expenses", ["session_id"])

    # 6. Session Participants Table
    op.create_table(
        "session_participants",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("member_id", sa.Uuid(), nullable=True),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("gender", sa.String(length=10), nullable=False),
        sa.Column(
            "play_stage",
            sa.String(length=20),
            server_default="full",
            nullable=False,
        ),
        sa.Column(
            "custom_fee_override",
            sa.Numeric(precision=12, scale=2),
            nullable=True,
        ),
        sa.Column(
            "calculated_fee",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column(
            "is_paid",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "paid_amount",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column("payment_method", sa.String(length=20), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_session_participants_id", "session_participants", ["id"])
    op.create_index(
        "ix_session_participants_session_id",
        "session_participants",
        ["session_id"],
    )
    op.create_index(
        "ix_session_participants_member_id",
        "session_participants",
        ["member_id"],
    )

    # 7. Debt Records Table
    op.create_table(
        "debt_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("host_id", sa.Uuid(), nullable=False),
        sa.Column("member_id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=True),
        sa.Column("amount_owed", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "amount_paid",
            sa.Numeric(precision=12, scale=2),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="unpaid",
            nullable=False,
        ),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["host_id"], ["hosts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_debt_records_id", "debt_records", ["id"])
    op.create_index("ix_debt_records_host_id", "debt_records", ["host_id"])
    op.create_index("ix_debt_records_member_id", "debt_records", ["member_id"])
    op.create_index("ix_debt_records_session_id", "debt_records", ["session_id"])


def downgrade() -> None:
    op.drop_table("debt_records")
    op.drop_table("session_participants")
    op.drop_table("session_expenses")
    op.drop_table("sessions")
    op.drop_table("members")
    op.drop_table("venues")
    op.drop_table("hosts")
