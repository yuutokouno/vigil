from fastapi import APIRouter, Depends, HTTPException, Query

from app.di.auth import ProjectAuthContext, verify_project_membership
from app.di.bug import get_bug_usecase
from app.domain.schemas import (
    BugCreate,
    BugListParams,
    BugListResponse,
    BugResponse,
    BugStatsResponse,
    BugUpdate,
    Category,
    Severity,
)
from app.usecase.bug_usecase import BugNotFoundError, BugUsecase

router = APIRouter(prefix="/api/bugs", tags=["bugs"])


@router.post("", response_model=BugResponse, status_code=201)
async def create_bug(
    bug: BugCreate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: BugUsecase = Depends(get_bug_usecase),
):
    return await usecase.create_bug(bug, _auth.project_id)


@router.get("", response_model=BugListResponse)
async def list_bugs(
    status: str | None = None,
    severity: Severity | None = None,
    category: Category | None = None,
    search: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: BugUsecase = Depends(get_bug_usecase),
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
    return await usecase.list_bugs(params, _auth.project_id)


@router.get("/stats", response_model=BugStatsResponse)
async def get_stats(
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: BugUsecase = Depends(get_bug_usecase),
):
    return await usecase.get_stats(_auth.project_id)


@router.get("/{bug_id}", response_model=BugResponse)
async def get_bug(
    bug_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: BugUsecase = Depends(get_bug_usecase),
):
    try:
        return await usecase.get_bug(bug_id, _auth.project_id)
    except BugNotFoundError:
        raise HTTPException(status_code=404, detail="Bug not found")


@router.patch("/{bug_id}", response_model=BugResponse)
async def update_bug(
    bug_id: str,
    bug: BugUpdate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: BugUsecase = Depends(get_bug_usecase),
):
    try:
        return await usecase.update_bug(bug_id, bug, _auth.project_id)
    except BugNotFoundError:
        raise HTTPException(status_code=404, detail="Bug not found")


@router.delete("/{bug_id}", status_code=204)
async def delete_bug(
    bug_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    usecase: BugUsecase = Depends(get_bug_usecase),
):
    try:
        await usecase.delete_bug(bug_id, _auth.project_id)
    except BugNotFoundError:
        raise HTTPException(status_code=404, detail="Bug not found")
