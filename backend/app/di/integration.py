from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.database import get_session
from app.infrastructure.repository.integration_repo import IntegrationRepository
from app.usecase.integration_usecase import IntegrationUsecase


def get_integration_usecase(session: AsyncSession = Depends(get_session)) -> IntegrationUsecase:
    return IntegrationUsecase(IntegrationRepository(session))


def get_integration_repo(session: AsyncSession = Depends(get_session)) -> IntegrationRepository:
    return IntegrationRepository(session)
