"""add_project_id_to_resources

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-03-15 02:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Default project seed data: created in Python code at first login, but we need
# a placeholder UUID so existing rows can be migrated to it.
# IMPORTANT: this UUID is written here for migration reproducibility only.
#            The actual default project is created by the application logic.
_DEFAULT_PROJECT_PLACEHOLDER = None  # NULL is fine — project_id is nullable for migration safety


def upgrade() -> None:
    # Add project_id as nullable FK to each resource table.
    # Existing rows will have project_id = NULL until migrated by application logic.
    op.add_column(
        'bugs',
        sa.Column('project_id', sa.UUID(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True),
    )
    op.create_index('idx_bugs_project_id', 'bugs', ['project_id'])

    op.add_column(
        'milestones',
        sa.Column('project_id', sa.UUID(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True),
    )

    op.add_column(
        'workflow_columns',
        sa.Column('project_id', sa.UUID(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True),
    )

    op.add_column(
        'integrations',
        sa.Column('project_id', sa.UUID(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True),
    )


def downgrade() -> None:
    op.drop_index('idx_bugs_project_id', table_name='bugs')
    op.drop_column('bugs', 'project_id')
    op.drop_column('milestones', 'project_id')
    op.drop_column('workflow_columns', 'project_id')
    op.drop_column('integrations', 'project_id')
