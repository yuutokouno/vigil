from fastapi import APIRouter, Depends, HTTPException

from app.di.milestone import get_milestone_usecase
from app.domain.schemas import MilestoneCreate, MilestoneResponse, MilestoneUpdate
from app.usecase.milestone_usecase import MilestoneNotFoundError, MilestoneUsecase

router = APIRouter(prefix="/api/milestones", tags=["milestones"])


@router.post("", response_model=MilestoneResponse, status_code=201)
async def create_milestone(
    data: MilestoneCreate,
    usecase: MilestoneUsecase = Depends(get_milestone_usecase),
) -> MilestoneResponse:
    return await usecase.create(data)


@router.get("", response_model=list[MilestoneResponse])
async def list_milestones(
    usecase: MilestoneUsecase = Depends(get_milestone_usecase),
) -> list[MilestoneResponse]:
    return await usecase.list_all()


@router.get("/{milestone_id}", response_model=MilestoneResponse)
async def get_milestone(
    milestone_id: str,
    usecase: MilestoneUsecase = Depends(get_milestone_usecase),
) -> MilestoneResponse:
    try:
        return await usecase.get(milestone_id)
    except MilestoneNotFoundError:
        raise HTTPException(status_code=404, detail="Milestone not found")


@router.patch("/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: str,
    data: MilestoneUpdate,
    usecase: MilestoneUsecase = Depends(get_milestone_usecase),
) -> MilestoneResponse:
    try:
        return await usecase.update(milestone_id, data)
    except MilestoneNotFoundError:
        raise HTTPException(status_code=404, detail="Milestone not found")


@router.delete("/{milestone_id}", status_code=204)
async def delete_milestone(
    milestone_id: str,
    usecase: MilestoneUsecase = Depends(get_milestone_usecase),
) -> None:
    try:
        await usecase.delete(milestone_id)
    except MilestoneNotFoundError:
        raise HTTPException(status_code=404, detail="Milestone not found")
