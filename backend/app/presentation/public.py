"""Public (unauthenticated) endpoints — accessible without a JWT.

Currently:
- POST /api/public/bugs  — CS / customer report form
"""
from fastapi import APIRouter, Depends

from app.di.bug import get_bug_usecase
from app.domain.schemas import BugCreate, PublicBugCreate, PublicBugResponse, Source
from app.usecase.bug_usecase import BugUsecase

router = APIRouter(prefix="/api/public", tags=["public"])


@router.post("/bugs", response_model=PublicBugResponse, status_code=201)
async def create_public_bug(
    data: PublicBugCreate,
    usecase: BugUsecase = Depends(get_bug_usecase),
) -> PublicBugResponse:
    """Create a bug from the external (unauthenticated) report form.

    Reports source as 'customer'. No project_id required — bugs are placed in
    the default project and reassigned by staff later.
    """
    bug_create = BugCreate(
        title=data.title,
        description=data.description,
        steps_to_reproduce=data.steps_to_reproduce,
        environment=data.environment,
        severity=data.severity,
        reported_by=data.reported_by,
        source=Source.MANUAL,  # TODO: add Source.CUSTOMER when available
        version=data.version,
        discovery_stage=None,  # Customers don't set this; staff set it on triage
    )
    bug = await usecase.create_bug(bug_create)
    return bug
