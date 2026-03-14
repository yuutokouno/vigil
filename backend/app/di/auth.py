"""Authentication and authorization dependency injection.

Two levels of auth guards:

- get_current_user()           — verifies JWT is valid and user exists.
                                 Does NOT require project_id (for /api/projects endpoint).
- verify_project_membership()  — extends get_current_user() by also requiring
                                 a valid project_id in the token and confirming
                                 the user is a member of that project.
"""
import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.domain.models import ProjectMember, User
from app.infrastructure.db.database import get_session


@dataclass
class AuthContext:
    user_id: str
    org_id: str | None
    project_id: str | None


@dataclass
class ProjectAuthContext(AuthContext):
    """Guaranteed non-null org_id and project_id."""
    org_id: str
    project_id: str


def _decode_jwt(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> AuthContext:
    """Verify JWT and return auth context. Does not require project_id."""
    payload = _decode_jwt(request)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing sub")

    result = await session.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return AuthContext(
        user_id=user_id,
        org_id=payload.get("org_id"),
        project_id=payload.get("project_id"),
    )


async def verify_project_membership(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> ProjectAuthContext:
    """Verify JWT contains project_id and user is a member of that project.

    Used on all resource endpoints (bugs, milestones, etc.) to enforce
    tenant isolation. Returns 401 if project_id missing, 403 if not a member.
    """
    payload = _decode_jwt(request)

    user_id = payload.get("sub")
    org_id = payload.get("org_id")
    project_id = payload.get("project_id")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing sub")
    if not project_id:
        raise HTTPException(
            status_code=401,
            detail="No project selected. Please select a project first.",
        )

    # Verify user exists
    result = await session.execute(select(User).where(User.id == uuid.UUID(user_id)))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=401, detail="User not found")

    # Verify project membership
    result = await session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == uuid.UUID(project_id),
            ProjectMember.user_id == uuid.UUID(user_id),
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Not a member of this project")

    return ProjectAuthContext(
        user_id=user_id,
        org_id=org_id or "",
        project_id=project_id,
    )
