"""add test management tables

Revision ID: i5j6k7l8m9n0
Revises: g3h4i5j6k7l8
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "i5j6k7l8m9n0"
down_revision = "g3h4i5j6k7l8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "releases",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=True),
        sa.Column("version", sa.String(50), nullable=False),
        sa.Column("release_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_releases_project_id", "releases", ["project_id"])

    op.create_table(
        "test_scenarios",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("feature_tag", sa.String(50), nullable=False),
        sa.Column("steps_json", JSONB, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_test_scenarios_project_id", "test_scenarios", ["project_id"])
    op.create_index("idx_test_scenarios_feature_tag", "test_scenarios", ["feature_tag"])

    op.create_table(
        "test_checklist_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("scenario_id", UUID(as_uuid=True), sa.ForeignKey("test_scenarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("release_id", UUID(as_uuid=True), sa.ForeignKey("releases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_checked", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("checked_by", sa.String(100), nullable=True),
        sa.Column("checked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_checklist_items_release_id", "test_checklist_items", ["release_id"])
    op.create_index("idx_checklist_items_scenario_id", "test_checklist_items", ["scenario_id"])


def downgrade() -> None:
    op.drop_table("test_checklist_items")
    op.drop_table("test_scenarios")
    op.drop_table("releases")
