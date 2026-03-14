"""add_version_discovery_stage_bug_number

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-03-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('bugs', sa.Column('version', sa.String(length=50), nullable=True))
    op.add_column('bugs', sa.Column('discovery_stage', sa.String(length=50), nullable=True))
    op.add_column(
        'bugs',
        sa.Column(
            'bug_number',
            sa.Integer(),
            sa.Identity(always=False),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column('bugs', 'bug_number')
    op.drop_column('bugs', 'discovery_stage')
    op.drop_column('bugs', 'version')
