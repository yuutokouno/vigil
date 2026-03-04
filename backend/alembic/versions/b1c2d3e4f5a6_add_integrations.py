"""add integrations

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f6
Create Date: 2026-03-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = 'b1c2d3e4f5a6'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'integrations',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('source_type', sa.String(20), nullable=False),
        sa.Column('direction', sa.String(20), nullable=False, server_default='inbound'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('credentials_enc', sa.LargeBinary(), nullable=True),
        sa.Column('trigger_rules', JSONB(), nullable=False, server_default='{}'),
        sa.Column('field_mappings', JSONB(), nullable=False, server_default='[]'),
        sa.Column('last_received_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_received', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'integration_events',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('integration_id', UUID(), nullable=False),
        sa.Column('direction', sa.String(10), nullable=False, server_default='inbound'),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('source_ref', sa.String(200), nullable=True),
        sa.Column('bug_id', UUID(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['integration_id'], ['integrations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bug_id'], ['bugs.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_integration_events_integration_id', 'integration_events', ['integration_id', 'created_at'])
    op.create_index('idx_integration_events_source_ref', 'integration_events', ['integration_id', 'source_ref'])
    op.add_column('bugs', sa.Column('external_ref', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('bugs', 'external_ref')
    op.drop_index('idx_integration_events_source_ref')
    op.drop_index('idx_integration_events_integration_id')
    op.drop_table('integration_events')
    op.drop_table('integrations')
