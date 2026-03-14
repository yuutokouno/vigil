from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.schemas import (
    BugCreate,
    DiscoveryStage,
    PublicBugCreate,
    PublicBugResponse,
    Source,
)
from app.repository.postgres import PostgresBugRepository
from app.usecase.bug_usecase import BugUsecase

router = APIRouter(prefix="/api/public", tags=["public"])

# Rate limiter: 5 requests per minute per IP address
limiter = Limiter(key_func=get_remote_address)


def _get_usecase(session: AsyncSession = Depends(get_session)) -> BugUsecase:
    repository = PostgresBugRepository(session)
    return BugUsecase(repository)


@router.post("/bugs", response_model=PublicBugResponse, status_code=201)
@limiter.limit("5/minute")
async def create_public_bug(
    request: Request,
    payload: PublicBugCreate,
    usecase: BugUsecase = Depends(_get_usecase),
) -> PublicBugResponse:
    """
    Unauthenticated endpoint for external/customer bug reports.
    Automatically sets source=customer and discovery_stage=customer.
    Returns a VIGIL-XXXX formatted bug number.
    """
    bug_data = BugCreate(
        title=payload.title,
        description=payload.description,
        steps_to_reproduce=payload.steps_to_reproduce,
        environment=payload.environment,
        severity=payload.severity,
        source=Source.CUSTOMER,
        discovery_stage=DiscoveryStage.CUSTOMER,
    )
    created = await usecase.create_bug(bug_data)
    formatted_number = f"VIGIL-{created.bug_number:04d}"
    return PublicBugResponse(id=created.id, bug_number=formatted_number)
