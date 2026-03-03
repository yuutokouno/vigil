from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.schemas import (
    BugCreate,
    BugListParams,
    BugListResponse,
    BugResponse,
    BugStatsResponse,
    BugUpdate,
    Category,
    Severity,
    Status,
)
from app.repository.postgres import PostgresBugRepository
from app.usecase.bug_usecase import (
    BugNotFoundError,
    BugUsecase,
    InvalidStatusTransitionError,
)

router = APIRouter(prefix="/api/bugs", tags=["bugs"])


def _get_usecase(session: AsyncSession = Depends(get_session)) -> BugUsecase:
    repository = PostgresBugRepository(session)
    return BugUsecase(repository)


@router.post("", response_model=BugResponse, status_code=201)
async def create_bug(
    bug: BugCreate,
    usecase: BugUsecase = Depends(_get_usecase),
):
    return await usecase.create_bug(bug)


@router.get("", response_model=BugListResponse)
async def list_bugs(
    status: Status | None = None,
    severity: Severity | None = None,
    category: Category | None = None,
    search: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    usecase: BugUsecase = Depends(_get_usecase),
):
    params = BugListParams(
        status=status,
        severity=severity,
        category=category,
        search=search,
        sort=sort,
        order=order,
        page=page,
        limit=limit,
    )
    return await usecase.list_bugs(params)


@router.get("/stats", response_model=BugStatsResponse)
async def get_stats(
    usecase: BugUsecase = Depends(_get_usecase),
):
    return await usecase.get_stats()


@router.get("/{bug_id}", response_model=BugResponse)
async def get_bug(
    bug_id: str,
    usecase: BugUsecase = Depends(_get_usecase),
):
    try:
        return await usecase.get_bug(bug_id)
    except BugNotFoundError:
        raise HTTPException(status_code=404, detail="Bug not found")


@router.patch("/{bug_id}", response_model=BugResponse)
async def update_bug(
    bug_id: str,
    bug: BugUpdate,
    usecase: BugUsecase = Depends(_get_usecase),
):
    try:
        return await usecase.update_bug(bug_id, bug)
    except BugNotFoundError:
        raise HTTPException(status_code=404, detail="Bug not found")
    except InvalidStatusTransitionError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status transition: {e.current} -> {e.target}",
        )


@router.delete("/{bug_id}", status_code=204)
async def delete_bug(
    bug_id: str,
    usecase: BugUsecase = Depends(_get_usecase),
):
    try:
        await usecase.delete_bug(bug_id)
    except BugNotFoundError:
        raise HTTPException(status_code=404, detail="Bug not found")
