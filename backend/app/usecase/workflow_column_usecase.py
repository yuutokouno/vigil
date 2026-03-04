import re

from app.domain.schemas import (
    WorkflowColumnCreate,
    WorkflowColumnResponse,
    WorkflowColumnUpdate,
)
from app.repository.workflow_column_repo import WorkflowColumnRepository

_SLUG_RE = re.compile(r'^[a-z][a-z0-9_]{0,48}$')


class WorkflowColumnNotFoundError(Exception):
    def __init__(self, column_id: str) -> None:
        super().__init__(f"Workflow column not found: {column_id}")


class WorkflowColumnFixedError(Exception):
    def __init__(self, column_id: str) -> None:
        super().__init__(f"Cannot modify fixed column: {column_id}")


class WorkflowColumnHasBugsError(Exception):
    def __init__(self, column_id: str) -> None:
        super().__init__(f"Column still has bugs assigned: {column_id}")


class WorkflowColumnUsecase:
    def __init__(self, repo: WorkflowColumnRepository) -> None:
        self._repo = repo

    async def list_all(self) -> list[WorkflowColumnResponse]:
        return await self._repo.list_all()

    async def create(self, data: WorkflowColumnCreate) -> WorkflowColumnResponse:
        if not _SLUG_RE.match(data.slug):
            raise ValueError(
                f"Invalid slug '{data.slug}': must start with a lowercase letter "
                "and contain only lowercase letters, digits, and underscores (max 50 chars)."
            )
        return await self._repo.create(data)

    async def update(
        self, column_id: str, data: WorkflowColumnUpdate
    ) -> WorkflowColumnResponse:
        result = await self._repo.update(column_id, data)
        if result is None:
            existing = await self._repo.get_by_id(column_id)
            if existing is None:
                raise WorkflowColumnNotFoundError(column_id)
            raise WorkflowColumnFixedError(column_id)
        return result

    async def delete(self, column_id: str) -> None:
        result = await self._repo.delete(column_id)
        if result is False:
            raise WorkflowColumnNotFoundError(column_id)
        if result == "fixed":
            raise WorkflowColumnFixedError(column_id)
        if result == "has_bugs":
            raise WorkflowColumnHasBugsError(column_id)
