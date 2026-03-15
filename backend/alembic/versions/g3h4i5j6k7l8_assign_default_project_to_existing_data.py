"""assign default project to existing data

Revision ID: g3h4i5j6k7l8
Revises: f2a3b4c5d6e7
Create Date: 2026-03-15 00:00:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "g3h4i5j6k7l8"
down_revision = "f2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Assign NULL project_id rows to the 'default' project if it exists.
    # This is safe to run even if no 'default' project exists — the EXISTS
    # guard ensures no rows are updated in that case.
    for table in ("bugs", "milestones", "workflow_columns", "integrations"):
        op.execute(f"""
            UPDATE {table}
            SET project_id = (
                SELECT id FROM projects WHERE slug = 'default' LIMIT 1
            )
            WHERE project_id IS NULL
              AND EXISTS (SELECT 1 FROM projects WHERE slug = 'default')
        """)  # noqa: S608


def downgrade() -> None:
    # Cannot safely reverse: we don't know which rows were originally NULL.
    pass
