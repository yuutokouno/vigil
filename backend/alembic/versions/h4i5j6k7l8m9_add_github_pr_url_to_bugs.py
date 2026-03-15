"""add github_pr_url to bugs

Revision ID: h4i5j6k7l8m9
Revises: g3h4i5j6k7l8
Create Date: 2026-03-15 01:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "h4i5j6k7l8m9"
down_revision = "g3h4i5j6k7l8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bugs",
        sa.Column("github_pr_url", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("bugs", "github_pr_url")
