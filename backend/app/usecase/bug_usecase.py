from datetime import datetime, timezone

from app.domain.schemas import (
    BugCreate,
    BugListParams,
    BugListResponse,
    BugResponse,
    BugStatsResponse,
    BugUpdate,
)
from app.infrastructure.repository.base import BugRepository


class BugNotFoundError(Exception):
    def __init__(self, bug_id: str) -> None:
        self.bug_id = bug_id
        super().__init__(f"Bug not found: {bug_id}")


class BugUsecase:
    def __init__(self, repository: BugRepository) -> None:
        self._repository = repository

    async def create_bug(self, bug: BugCreate) -> BugResponse:
        return await self._repository.create(bug)

    async def get_bug(self, bug_id: str) -> BugResponse:
        bug = await self._repository.get_by_id(bug_id)
        if bug is None:
            raise BugNotFoundError(bug_id)
        return bug

    async def list_bugs(self, params: BugListParams) -> BugListResponse:
        return await self._repository.list_bugs(params)

    async def update_bug(self, bug_id: str, update: BugUpdate) -> BugResponse:
        existing = await self._repository.get_by_id(bug_id)
        if existing is None:
            raise BugNotFoundError(bug_id)

        if update.status is not None:
            if update.status == "closed":
                update_data = update.model_dump(exclude_unset=True)
                update_data["closed_at"] = datetime.now(timezone.utc)
                update = BugUpdate.model_validate(update_data)
            elif existing.status == "closed" and update.status != "closed":
                # Moving out of closed: clear closed_at
                update_data = update.model_dump(exclude_unset=True)
                update_data["closed_at"] = None
                update = BugUpdate.model_validate(update_data)

        result = await self._repository.update(bug_id, update)
        if result is None:
            raise BugNotFoundError(bug_id)
        return result

    async def delete_bug(self, bug_id: str) -> None:
        deleted = await self._repository.delete(bug_id)
        if not deleted:
            raise BugNotFoundError(bug_id)

    async def get_stats(self) -> BugStatsResponse:
        return await self._repository.get_stats()
