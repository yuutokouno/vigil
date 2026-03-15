from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from app.di.auth import ProjectAuthContext, verify_project_membership
from app.di.workflow_column import get_workflow_column_usecase
from app.domain.schemas import (
    WorkflowColumnCreate,
    WorkflowColumnResponse,
    WorkflowColumnUpdate,
)
from app.usecase.workflow_column_usecase import (
    WorkflowColumnFixedError,
    WorkflowColumnHasBugsError,
    WorkflowColumnNotFoundError,
    WorkflowColumnUsecase,
)

router = APIRouter(prefix="/api/workflow-columns", tags=["workflow-columns"])


@router.get("", response_model=list[WorkflowColumnResponse])
async def list_workflow_columns(
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: WorkflowColumnUsecase = Depends(get_workflow_column_usecase),
) -> list[WorkflowColumnResponse]:
    return await usecase.list_all(_auth.project_id)


@router.post("", response_model=WorkflowColumnResponse, status_code=201)
async def create_workflow_column(
    data: WorkflowColumnCreate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: WorkflowColumnUsecase = Depends(get_workflow_column_usecase),
) -> WorkflowColumnResponse:
    try:
        return await usecase.create(data, _auth.project_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Slug already exists")


@router.patch("/{column_id}", response_model=WorkflowColumnResponse)
async def update_workflow_column(
    column_id: str,
    data: WorkflowColumnUpdate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: WorkflowColumnUsecase = Depends(get_workflow_column_usecase),
) -> WorkflowColumnResponse:
    try:
        return await usecase.update(column_id, data, _auth.project_id)
    except WorkflowColumnNotFoundError:
        raise HTTPException(status_code=404, detail="Workflow column not found")
    except WorkflowColumnFixedError:
        raise HTTPException(status_code=403, detail="Cannot modify a fixed column")


@router.delete("/{column_id}", status_code=204)
async def delete_workflow_column(
    column_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: WorkflowColumnUsecase = Depends(get_workflow_column_usecase),
) -> None:
    try:
        await usecase.delete(column_id, _auth.project_id)
    except WorkflowColumnNotFoundError:
        raise HTTPException(status_code=404, detail="Workflow column not found")
    except WorkflowColumnFixedError:
        raise HTTPException(status_code=403, detail="Cannot delete a fixed column")
    except WorkflowColumnHasBugsError:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete column: bugs still assigned to this status",
        )
