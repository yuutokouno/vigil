import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Bug, Milestone
from app.domain.schemas import MilestoneCreate, MilestoneResponse, MilestoneUpdate


class MilestoneRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, data: MilestoneCreate) -> MilestoneResponse:
        milestone = Milestone(**data.model_dump(exclude_unset=True))
        self._session.add(milestone)
        await self._session.commit()
        await self._session.refresh(milestone)
        return await self._to_response(milestone)

    async def get_by_id(self, milestone_id: str) -> MilestoneResponse | None:
        milestone = await self._session.get(Milestone, uuid.UUID(milestone_id))
        if milestone is None:
            return None
        return await self._to_response(milestone)

    async def list_all(self) -> list[MilestoneResponse]:
        result = await self._session.execute(
            select(Milestone).order_by(Milestone.created_at.desc())
        )
        milestones = result.scalars().all()
        return [await self._to_response(m) for m in milestones]

    async def update(
        self, milestone_id: str, data: MilestoneUpdate
    ) -> MilestoneResponse | None:
        milestone = await self._session.get(Milestone, uuid.UUID(milestone_id))
        if milestone is None:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(milestone, field, value)

        await self._session.commit()
        await self._session.refresh(milestone)
        return await self._to_response(milestone)

    async def delete(self, milestone_id: str) -> bool:
        milestone = await self._session.get(Milestone, uuid.UUID(milestone_id))
        if milestone is None:
            return False
        await self._session.delete(milestone)
        await self._session.commit()
        return True

    async def _to_response(self, milestone: Milestone) -> MilestoneResponse:
        total_bugs, closed_bugs = await self._count_bugs(str(milestone.id))
        return MilestoneResponse(
            id=str(milestone.id),
            title=milestone.title,
            description=milestone.description,
            due_date=milestone.due_date,
            status=milestone.status,
            created_at=milestone.created_at,
            updated_at=milestone.updated_at,
            total_bugs=total_bugs,
            closed_bugs=closed_bugs,
        )

    async def _count_bugs(self, milestone_id: str) -> tuple[int, int]:
        mid = uuid.UUID(milestone_id)
        total_result = await self._session.execute(
            select(func.count()).where(Bug.milestone_id == mid)
        )
        total = total_result.scalar() or 0

        closed_result = await self._session.execute(
            select(func.count()).where(
                Bug.milestone_id == mid, Bug.status == "closed"
            )
        )
        closed = closed_result.scalar() or 0

        return total, closed
