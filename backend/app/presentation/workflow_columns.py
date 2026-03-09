from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.schemas import (
    WorkflowColumnCreate,
    WorkflowColumnResponse,
    WorkflowColumnUpdate,
)
from app.repository.workflow_column_repo import WorkflowColumnRepository
from app.usecase.workflow_column_usecase import (
    WorkflowColumnFixedError,
    WorkflowColumnHasBugsError,
    WorkflowColumnNotFoundError,
    WorkflowColumnUsecase,
)

router = APIRouter(prefix="/api/workflow-columns", tags=["workflow-columns"])


def _get_usecase(session: AsyncSession = Depends(get_session)) -> WorkflowColumnUsecase:
    return WorkflowColumnUsecase(WorkflowColumnRepository(session))


@router.get("", response_model=list[WorkflowColumnResponse])
async def list_workflow_columns(
    usecase: WorkflowColumnUsecase = Depends(_get_usecase),
) -> list[WorkflowColumnResponse]:
    return await usecase.list_all()


@router.post("", response_model=WorkflowColumnResponse, status_code=201)
async def create_workflow_column(
    data: WorkflowColumnCreate,
    usecase: WorkflowColumnUsecase = Depends(_get_usecase),
) -> WorkflowColumnResponse:
    try:
        return await usecase.create(data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Slug already exists")


@router.patch("/{column_id}", response_model=WorkflowColumnResponse)
async def update_workflow_column(
    column_id: str,
    data: WorkflowColumnUpdate,
    usecase: WorkflowColumnUsecase = Depends(_get_usecase),
) -> WorkflowColumnResponse:
    try:
        return await usecase.update(column_id, data)
    except WorkflowColumnNotFoundError:
        raise HTTPException(status_code=404, detail="Workflow column not found")
    except WorkflowColumnFixedError:
        raise HTTPException(status_code=403, detail="Cannot modify a fixed column")


@router.delete("/{column_id}", status_code=204)
async def delete_workflow_column(
    column_id: str,
    usecase: WorkflowColumnUsecase = Depends(_get_usecase),
) -> None:
    try:
        await usecase.delete(column_id)
    except WorkflowColumnNotFoundError:
        raise HTTPException(status_code=404, detail="Workflow column not found")
    except WorkflowColumnFixedError:
        raise HTTPException(status_code=403, detail="Cannot delete a fixed column")
    except WorkflowColumnHasBugsError:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete column: bugs still assigned to this status",
        )
