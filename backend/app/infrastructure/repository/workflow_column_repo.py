import uuid

import sqlalchemy as sa
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Bug, WorkflowColumn
from app.domain.schemas import (
    WorkflowColumnCreate,
    WorkflowColumnResponse,
    WorkflowColumnUpdate,
)


class WorkflowColumnRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self, project_id: str) -> list[WorkflowColumnResponse]:
        result = await self._session.execute(
            select(WorkflowColumn)
            .where(WorkflowColumn.project_id == uuid.UUID(project_id))
            .order_by(WorkflowColumn.position)
        )
        return [self._to_response(col) for col in result.scalars().all()]

    async def get_by_id(
        self, column_id: str, project_id: str
    ) -> WorkflowColumnResponse | None:
        col = await self._session.get(WorkflowColumn, uuid.UUID(column_id))
        if col is None or str(col.project_id) != project_id:
            return None
        return self._to_response(col)

    async def create(
        self, data: WorkflowColumnCreate, project_id: str
    ) -> WorkflowColumnResponse:
        pid = uuid.UUID(project_id)
        # Insert before "closed": find max position excluding closed, then shift closed up
        result = await self._session.execute(
            select(func.max(WorkflowColumn.position)).where(
                WorkflowColumn.project_id == pid,
                WorkflowColumn.slug != "closed",
            )
        )
        max_pos = result.scalar_one_or_none() or 0
        await self._session.execute(
            sa.update(WorkflowColumn)
            .where(WorkflowColumn.project_id == pid, WorkflowColumn.slug == "closed")
            .values(position=max_pos + 2)
        )
        col = WorkflowColumn(
            name=data.name,
            slug=data.slug,
            position=max_pos + 1,
            is_fixed=False,
            project_id=pid,
        )
        self._session.add(col)
        await self._session.commit()
        await self._session.refresh(col)
        return self._to_response(col)

    async def update(
        self, column_id: str, data: WorkflowColumnUpdate, project_id: str
    ) -> WorkflowColumnResponse | None:
        col = await self._session.get(WorkflowColumn, uuid.UUID(column_id))
        if col is None or col.is_fixed or str(col.project_id) != project_id:
            return None
        if data.name is not None:
            col.name = data.name
        if data.position is not None:
            col.position = data.position
        await self._session.commit()
        await self._session.refresh(col)
        return self._to_response(col)

    async def delete(self, column_id: str, project_id: str) -> bool | str:
        """Returns True on success, 'fixed' for fixed columns, 'has_bugs' if bugs exist."""
        col = await self._session.get(WorkflowColumn, uuid.UUID(column_id))
        if col is None or str(col.project_id) != project_id:
            return False
        if col.is_fixed:
            return "fixed"
        count_result = await self._session.execute(
            select(func.count()).where(
                Bug.status == col.slug,
                Bug.project_id == uuid.UUID(project_id),
            )
        )
        if count_result.scalar_one() > 0:
            return "has_bugs"
        await self._session.delete(col)
        await self._session.commit()
        return True

    @staticmethod
    def _to_response(col: WorkflowColumn) -> WorkflowColumnResponse:
        return WorkflowColumnResponse(
            id=str(col.id),
            name=col.name,
            slug=col.slug,
            position=col.position,
            is_fixed=col.is_fixed,
            created_at=col.created_at,
        )
