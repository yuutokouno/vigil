"""add_workflow_columns

Revision ID: a1b2c3d4e5f6
Revises: 71dee8c46579
Create Date: 2026-03-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '71dee8c46579'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'workflow_columns',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('slug', sa.String(length=50), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('is_fixed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug', name='uq_workflow_columns_slug'),
    )
    op.execute("""
        INSERT INTO workflow_columns (id, name, slug, position, is_fixed) VALUES
        (gen_random_uuid(), '未対応',   'open',        0, true),
        (gen_random_uuid(), '対応中',   'in_progress', 1, false),
        (gen_random_uuid(), '検証待ち', 'in_review',   2, false),
        (gen_random_uuid(), 'クローズ', 'closed',      3, true)
    """)
    # Expand bugs.status from String(20) to String(50) to accommodate custom slugs
    op.alter_column(
        'bugs', 'status',
        existing_type=sa.String(length=20),
        type_=sa.String(length=50),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'bugs', 'status',
        existing_type=sa.String(length=50),
        type_=sa.String(length=20),
        existing_nullable=False,
    )
    op.drop_table('workflow_columns')
