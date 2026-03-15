"""add bug bash tables

Revision ID: j6k7l8m9n0o1
Revises: i5j6k7l8m9n0
Create Date: 2026-03-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "j6k7l8m9n0o1"
down_revision = "i5j6k7l8m9n0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bug_bash_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="scheduled"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_bug_bash_events_project_id", "bug_bash_events", ["project_id"])

    op.create_table(
        "bug_bash_participations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("bug_bash_events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_bug_bash_participations_event_id", "bug_bash_participations", ["event_id"])
    op.create_unique_constraint("uq_bug_bash_participation", "bug_bash_participations", ["event_id", "user_id"])

    op.create_table(
        "bug_bash_submissions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("bug_bash_events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bug_id", UUID(as_uuid=True), sa.ForeignKey("bugs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_bug_bash_submissions_event_id", "bug_bash_submissions", ["event_id"])
    op.create_unique_constraint("uq_bug_bash_submission", "bug_bash_submissions", ["event_id", "bug_id"])


def downgrade() -> None:
    op.drop_table("bug_bash_submissions")
    op.drop_table("bug_bash_participations")
    op.drop_table("bug_bash_events")
