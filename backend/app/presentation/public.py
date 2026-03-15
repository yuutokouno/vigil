"""Public (unauthenticated) endpoints — accessible without a JWT.

Currently:
- POST /api/public/bugs  — CS / customer report form
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.di.bug import get_bug_usecase
from app.domain.models import Project
from app.domain.schemas import BugCreate, PublicBugCreate, PublicBugResponse, Source
from app.infrastructure.db.database import get_session
from app.usecase.bug_usecase import BugUsecase

router = APIRouter(prefix="/api/public", tags=["public"])


@router.post("/bugs", response_model=PublicBugResponse, status_code=201)
async def create_public_bug(
    data: PublicBugCreate,
    usecase: BugUsecase = Depends(get_bug_usecase),
    session: AsyncSession = Depends(get_session),
) -> PublicBugResponse:
    """Create a bug from the external (unauthenticated) report form.

    Assigns to the 'default' project so staff can triage and reassign later.
    """
    result = await session.execute(
        select(Project).where(Project.slug == "default").limit(1)
    )
    default_project = result.scalar_one_or_none()
    if default_project is None:
        raise HTTPException(
            status_code=503,
            detail="No default project configured. Please contact the administrator.",
        )

    bug_create = BugCreate(
        title=data.title,
        description=data.description,
        steps_to_reproduce=data.steps_to_reproduce,
        environment=data.environment,
        severity=data.severity,
        reported_by=data.reported_by,
        source=Source.MANUAL,
        version=data.version,
        discovery_stage=None,  # Set by staff during triage
    )
    return await usecase.create_bug(bug_create, str(default_project.id))
