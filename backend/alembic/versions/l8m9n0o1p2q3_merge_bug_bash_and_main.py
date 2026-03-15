"""merge bug_bash branch with main

Revision ID: l8m9n0o1p2q3
Revises: 29e3109fe4f2, j6k7l8m9n0o1
Create Date: 2026-03-16
"""
from alembic import op
import sqlalchemy as sa

revision = "l8m9n0o1p2q3"
down_revision = ("29e3109fe4f2", "j6k7l8m9n0o1")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
