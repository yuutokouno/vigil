from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.database import get_session
from app.infrastructure.repository.test_scenario_repo import TestScenarioRepository


def get_test_scenario_repo(
    session: AsyncSession = Depends(get_session),
) -> TestScenarioRepository:
    return TestScenarioRepository(session)
