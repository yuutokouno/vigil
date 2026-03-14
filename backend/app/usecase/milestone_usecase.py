from app.domain.schemas import MilestoneCreate, MilestoneResponse, MilestoneUpdate
from app.infrastructure.repository.milestone_repo import MilestoneRepository


class MilestoneNotFoundError(Exception):
    pass


class MilestoneUsecase:
    def __init__(self, repo: MilestoneRepository) -> None:
        self._repo = repo

    async def create(self, data: MilestoneCreate) -> MilestoneResponse:
        return await self._repo.create(data)

    async def get(self, milestone_id: str) -> MilestoneResponse:
        milestone = await self._repo.get_by_id(milestone_id)
        if milestone is None:
            raise MilestoneNotFoundError(milestone_id)
        return milestone

    async def list_all(self) -> list[MilestoneResponse]:
        return await self._repo.list_all()

    async def update(
        self, milestone_id: str, data: MilestoneUpdate
    ) -> MilestoneResponse:
        milestone = await self._repo.update(milestone_id, data)
        if milestone is None:
            raise MilestoneNotFoundError(milestone_id)
        return milestone

    async def delete(self, milestone_id: str) -> None:
        deleted = await self._repo.delete(milestone_id)
        if not deleted:
            raise MilestoneNotFoundError(milestone_id)
