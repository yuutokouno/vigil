from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.database import get_session
from app.infrastructure.repository.workflow_column_repo import WorkflowColumnRepository
from app.usecase.workflow_column_usecase import WorkflowColumnUsecase


def get_workflow_column_usecase(session: AsyncSession = Depends(get_session)) -> WorkflowColumnUsecase:
    return WorkflowColumnUsecase(WorkflowColumnRepository(session))
