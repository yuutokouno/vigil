"""merge_github_and_test_management_branches

Revision ID: 29e3109fe4f2
Revises: h4i5j6k7l8m9, i5j6k7l8m9n0
Create Date: 2026-03-15 16:38:21.281628

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '29e3109fe4f2'
down_revision: Union[str, None] = ('h4i5j6k7l8m9', 'i5j6k7l8m9n0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
