from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.di.integration import get_integration_usecase
from app.domain.schemas import (
    IntegrationCreate,
    IntegrationEventResponse,
    IntegrationResponse,
    IntegrationUpdate,
    SchemaFetchRequest,
    TestConnectionResponse,
)
from app.usecase.integration_usecase import IntegrationNotFoundError, IntegrationUsecase

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("", response_model=list[IntegrationResponse])
async def list_integrations(usecase: IntegrationUsecase = Depends(get_integration_usecase)) -> list[IntegrationResponse]:
    return await usecase.list_all()


@router.post("", response_model=IntegrationResponse, status_code=201)
async def create_integration(
    data: IntegrationCreate,
    usecase: IntegrationUsecase = Depends(get_integration_usecase),
) -> IntegrationResponse:
    return await usecase.create(data)


# Declare literal-segment routes before parameterized routes to ensure correct resolution
@router.post("/schema/{source_type}", response_model=list[dict[str, Any]])
async def get_source_schema(
    source_type: str,
    body: SchemaFetchRequest,
    usecase: IntegrationUsecase = Depends(get_integration_usecase),
) -> list[dict[str, Any]]:
    """Return available source fields for field mapping UI (uses provided credentials, not saved)."""
    return await usecase.fetch_schema(source_type, body.credentials)


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(
    integration_id: str,
    usecase: IntegrationUsecase = Depends(get_integration_usecase),
) -> IntegrationResponse:
    try:
        return await usecase.get(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.patch("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: str,
    data: IntegrationUpdate,
    usecase: IntegrationUsecase = Depends(get_integration_usecase),
) -> IntegrationResponse:
    try:
        return await usecase.update(integration_id, data)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.delete("/{integration_id}", status_code=204)
async def delete_integration(
    integration_id: str,
    usecase: IntegrationUsecase = Depends(get_integration_usecase),
) -> None:
    try:
        await usecase.delete(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.post("/{integration_id}/test", response_model=TestConnectionResponse)
async def test_integration(
    integration_id: str,
    usecase: IntegrationUsecase = Depends(get_integration_usecase),
) -> TestConnectionResponse:
    try:
        ok = await usecase.test_connection(integration_id)
        return TestConnectionResponse(ok=ok)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.get("/{integration_id}/events", response_model=list[IntegrationEventResponse])
async def list_integration_events(
    integration_id: str,
    limit: int = Query(50, ge=1, le=200),
    usecase: IntegrationUsecase = Depends(get_integration_usecase),
) -> list[IntegrationEventResponse]:
    try:
        return await usecase.list_events(integration_id, limit)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")
