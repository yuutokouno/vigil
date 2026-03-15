"""Project management endpoints.

GET  /api/projects              — list user's projects (requires get_current_user, not project membership)
POST /api/auth/switch-project   — issue new JWT with org_id + project_id
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.di.auth import AuthContext, get_current_user
from app.domain.schemas import ProjectResponse
from app.infrastructure.db.database import get_session
from app.infrastructure.repository.project_repo import ProjectRepository
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


@router.post("/api/auth/switch-project")
async def switch_project(
    project_id: str,
    auth: AuthContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Issue a new JWT that includes the selected project_id.

    The client must store this token and use it for all subsequent requests.
    """
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify membership: the user must belong to the project
    from sqlalchemy import select
    from app.domain.models import ProjectMember
    import uuid
    result = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == uuid.UUID(project_id),
            ProjectMember.user_id == uuid.UUID(auth.user_id),
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Not a member of this project")

    # Fetch org_id from the project
    org_id = str(project.org_id)

    token = _create_token(
        user_id=auth.user_id,
        org_id=org_id,
        project_id=project_id,
    )
    return {"token": token, "project_id": project_id, "org_id": org_id}
