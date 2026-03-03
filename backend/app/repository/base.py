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
    async def create(self, bug: BugCreate) -> BugResponse: ...

    @abstractmethod
    async def get_by_id(self, bug_id: str) -> BugResponse | None: ...

    @abstractmethod
    async def list_bugs(self, params: BugListParams) -> BugListResponse: ...

    @abstractmethod
    async def update(self, bug_id: str, bug: BugUpdate) -> BugResponse | None: ...

    @abstractmethod
    async def delete(self, bug_id: str) -> bool: ...

    @abstractmethod
    async def get_stats(self) -> BugStatsResponse: ...
