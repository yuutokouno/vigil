from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.database import get_session
from app.infrastructure.repository.milestone_repo import MilestoneRepository
from app.usecase.milestone_usecase import MilestoneUsecase


def get_milestone_usecase(session: AsyncSession = Depends(get_session)) -> MilestoneUsecase:
    return MilestoneUsecase(MilestoneRepository(session))
