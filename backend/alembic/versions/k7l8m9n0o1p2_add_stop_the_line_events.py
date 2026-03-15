"""add stop_the_line_events table

Revision ID: k7l8m9n0o1p2
Revises: j6k7l8m9n0o1
Create Date: 2026-03-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "k7l8m9n0o1p2"
down_revision = "l8m9n0o1p2q3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stop_the_line_events",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "project_id",
            UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "triggered_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("critical_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("high_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("threshold_critical", sa.Integer(), nullable=False),
        sa.Column("threshold_high", sa.Integer(), nullable=False),
    )
    op.create_index(
        "ix_stop_the_line_project_resolved",
        "stop_the_line_events",
        ["project_id", "resolved_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_stop_the_line_project_resolved", table_name="stop_the_line_events")
    op.drop_table("stop_the_line_events")
