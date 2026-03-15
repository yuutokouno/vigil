from abc import ABC, abstractmethod

from app.domain.schemas import (
    BugCreate,
    BugListParams,
    BugListResponse,
    BugResponse,
    BugStatsResponse,
    BugUpdate,
)


class BugRepository(ABC):
    @abstractmethod
    async def create(self, bug: BugCreate, project_id: str) -> BugResponse: ...

    @abstractmethod
    async def get_by_id(self, bug_id: str, project_id: str) -> BugResponse | None: ...

    @abstractmethod
    async def list_bugs(
        self, params: BugListParams, project_id: str
    ) -> BugListResponse: ...

    @abstractmethod
    async def update(
        self, bug_id: str, bug: BugUpdate, project_id: str
    ) -> BugResponse | None: ...

    @abstractmethod
    async def delete(self, bug_id: str, project_id: str) -> bool: ...

    @abstractmethod
    async def get_stats(self, project_id: str) -> BugStatsResponse: ...

    @abstractmethod
    async def get_by_bug_number(self, bug_number: int, project_id: str) -> BugResponse | None: ...
