import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.connectors.github.client import GitHubClient
from app.di.auth import ProjectAuthContext, verify_project_membership
from app.di.bug import get_bug_usecase
from app.di.integration import get_integration_repo
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
from app.infrastructure.connectors.encryption import CredentialDecryptionError, decrypt_credentials
from app.infrastructure.repository.integration_repo import IntegrationRepository
from app.usecase.bug_usecase import BugNotFoundError, BugUsecase

logger = logging.getLogger(__name__)

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
    integration_repo: IntegrationRepository = Depends(get_integration_repo),
):
    try:
        existing = await usecase.get_bug(bug_id, _auth.project_id)
        updated = await usecase.update_bug(bug_id, bug, _auth.project_id)
    except BugNotFoundError:
        raise HTTPException(status_code=404, detail="Bug not found")

    # Outbound (#13): when a bug with a linked GitHub Issue is closed,
    # add "resolved" label and post a comment on the GitHub Issue (best-effort).
    if (
        bug.status == "closed"
        and existing.status != "closed"
        and updated.github_issue_url
    ):
        await _notify_github_issue_resolved(updated.github_issue_url, integration_repo)

    return updated


async def _notify_github_issue_resolved(
    issue_url: str, integration_repo: IntegrationRepository
) -> None:
    """Add 'resolved' label and post a comment to the linked GitHub Issue."""
    integrations = await integration_repo.list_active_by_source("github")
    if not integrations:
        return
    try:
        creds = decrypt_credentials(integrations[0].credentials_enc)
    except CredentialDecryptionError:
        return
    access_token = creds.get("access_token", "")
    if not access_token:
        return
    try:
        gh = GitHubClient(access_token)
        await gh.add_label(issue_url, "resolved")
        await gh.post_comment(issue_url, "このIssueはVigilで解決済みとしてマークされました。")
    except Exception:
        logger.exception("Failed to update GitHub Issue %s after bug close", issue_url)


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
