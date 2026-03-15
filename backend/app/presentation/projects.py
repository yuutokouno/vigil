"""Project management endpoints (#21).

GET    /api/projects                        — list user's projects
POST   /api/projects                        — create new project (owner role)
GET    /api/projects/{id}/members           — list members
POST   /api/projects/{id}/members           — invite member by GitHub username (owner only)
DELETE /api/projects/{id}/members/{user_id} — remove member (owner only)
POST   /api/auth/switch-project             — issue new JWT with org_id + project_id
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.di.auth import AuthContext, get_current_user
from app.domain.models import ProjectMember
from app.domain.schemas import (
    InviteMemberRequest,
    ProjectCreate,
    ProjectMemberResponse,
    ProjectResponse,
)
from app.infrastructure.db.database import get_session
from app.infrastructure.repository.project_repo import ProjectRepository, _to_slug
from app.presentation.auth import _create_token

router = APIRouter(tags=["projects"])


@router.get("/api/projects", response_model=list[ProjectResponse])
async def list_projects(
    auth: AuthContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ProjectResponse]:
    """Return all projects the authenticated user belongs to."""
    repo = ProjectRepository(session)
    return await repo.get_projects_for_user(auth.user_id)


@router.post("/api/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    auth: AuthContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjectResponse:
    """Create a new project under the user's org. The creator is added as owner."""
    repo = ProjectRepository(session)
    org = await repo.get_org_for_user(auth.user_id)
    if org is None:
        raise HTTPException(status_code=400, detail="No org found. Complete initial setup first.")

    slug = data.slug or _to_slug(data.name)
    project = await repo.create_project(
        org_id=str(org.id),
        name=data.name,
        slug=slug,
        creator_user_id=auth.user_id,
    )
    return project


@router.get("/api/projects/{project_id}/members", response_model=list[ProjectMemberResponse])
async def list_members(
    project_id: str,
    auth: AuthContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ProjectMemberResponse]:
    """List all members of the specified project."""
    repo = ProjectRepository(session)
    # Caller must be a member themselves
    role = await repo.get_member_role(project_id, auth.user_id)
    if role is None:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    return await repo.get_members(project_id)


@router.post(
    "/api/projects/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=201,
)
async def invite_member(
    project_id: str,
    body: InviteMemberRequest,
    auth: AuthContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjectMemberResponse:
    """Invite a user to the project by their GitHub username. Caller must be owner."""
    repo = ProjectRepository(session)
    role = await repo.get_member_role(project_id, auth.user_id)
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can invite members")

    result = await repo.invite_member(project_id, body.github_id, body.role)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"GitHub user '{body.github_id}' has not signed in to Vigil yet",
        )
    return result


@router.delete("/api/projects/{project_id}/members/{user_id}", status_code=204)
async def remove_member(
    project_id: str,
    user_id: str,
    auth: AuthContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Remove a member from the project. Caller must be owner."""
    if user_id == auth.user_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the project")

    repo = ProjectRepository(session)
    role = await repo.get_member_role(project_id, auth.user_id)
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can remove members")

    removed = await repo.remove_member(project_id, user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Member not found")


@router.post("/api/auth/switch-project")
async def switch_project(
    project_id: str,
    auth: AuthContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Issue a new JWT that includes the selected project_id."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == uuid.UUID(project_id),
            ProjectMember.user_id == uuid.UUID(auth.user_id),
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Not a member of this project")

    org_id = str(project.org_id)
    token = _create_token(
        user_id=auth.user_id,
        org_id=org_id,
        project_id=project_id,
    )
    return {"token": token, "project_id": project_id, "org_id": org_id}
