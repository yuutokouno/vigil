from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.database import get_session
from app.infrastructure.repository.postgres import PostgresBugRepository
from app.usecase.bug_usecase import BugUsecase


def get_bug_usecase(session: AsyncSession = Depends(get_session)) -> BugUsecase:
    return BugUsecase(PostgresBugRepository(session))
