from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.schemas import (
    IntegrationCreate,
    IntegrationEventResponse,
    IntegrationResponse,
    IntegrationUpdate,
)
from app.repository.integration_repo import IntegrationRepository
from app.usecase.integration_usecase import IntegrationNotFoundError, IntegrationUsecase

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


def _get_usecase(session: AsyncSession = Depends(get_session)) -> IntegrationUsecase:
    return IntegrationUsecase(IntegrationRepository(session))


@router.get("", response_model=list[IntegrationResponse])
async def list_integrations(usecase: IntegrationUsecase = Depends(_get_usecase)):
    return await usecase.list_all()


@router.post("", response_model=IntegrationResponse, status_code=201)
async def create_integration(
    data: IntegrationCreate,
    usecase: IntegrationUsecase = Depends(_get_usecase),
):
    return await usecase.create(data)


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(
    integration_id: str,
    usecase: IntegrationUsecase = Depends(_get_usecase),
):
    try:
        return await usecase.get(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.patch("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: str,
    data: IntegrationUpdate,
    usecase: IntegrationUsecase = Depends(_get_usecase),
):
    try:
        return await usecase.update(integration_id, data)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.delete("/{integration_id}", status_code=204)
async def delete_integration(
    integration_id: str,
    usecase: IntegrationUsecase = Depends(_get_usecase),
):
    try:
        await usecase.delete(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.post("/{integration_id}/test")
async def test_integration(
    integration_id: str,
    usecase: IntegrationUsecase = Depends(_get_usecase),
):
    try:
        ok = await usecase.test_connection(integration_id)
        return {"ok": ok}
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.get("/{integration_id}/events", response_model=list[IntegrationEventResponse])
async def list_integration_events(
    integration_id: str,
    limit: int = Query(50, ge=1, le=200),
    usecase: IntegrationUsecase = Depends(_get_usecase),
):
    try:
        return await usecase.list_events(integration_id, limit)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.post("/schema/{source_type}")
async def get_source_schema(
    source_type: str,
    credentials: dict[str, str],
    usecase: IntegrationUsecase = Depends(_get_usecase),
) -> list[dict[str, Any]]:
    """Return available source fields for field mapping UI (uses provided credentials, not saved)."""
    return await usecase.fetch_schema(source_type, credentials)
