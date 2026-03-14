# backend/app/usecase/integration_usecase.py
from typing import Any

from app.infrastructure.connectors.encryption import decrypt_credentials
from app.infrastructure.connectors.registry import get_connector
from app.domain.schemas import (
    IntegrationCreate,
    IntegrationEventResponse,
    IntegrationResponse,
    IntegrationUpdate,
)
from app.infrastructure.repository.integration_repo import IntegrationRepository


class IntegrationNotFoundError(Exception):
    def __init__(self, integration_id: str) -> None:
        self.integration_id = integration_id
        super().__init__(f"Integration not found: {integration_id}")


class IntegrationUsecase:
    def __init__(self, repository: IntegrationRepository) -> None:
        self._repository = repository

    async def create(self, data: IntegrationCreate) -> IntegrationResponse:
        return await self._repository.create(data)

    async def list_all(self) -> list[IntegrationResponse]:
        return await self._repository.list_all()

    async def get(self, integration_id: str) -> IntegrationResponse:
        response = await self._repository.get_response_by_id(integration_id)
        if response is None:
            raise IntegrationNotFoundError(integration_id)
        return response

    async def update(self, integration_id: str, data: IntegrationUpdate) -> IntegrationResponse:
        integration = await self._repository.get_by_id(integration_id)
        if integration is None:
            raise IntegrationNotFoundError(integration_id)
        return await self._repository.update(integration, data)

    async def delete(self, integration_id: str) -> None:
        integration = await self._repository.get_by_id(integration_id)
        if integration is None:
            raise IntegrationNotFoundError(integration_id)
        await self._repository.delete(integration)

    async def test_connection(self, integration_id: str) -> bool:
        integration = await self._repository.get_by_id(integration_id)
        if integration is None:
            raise IntegrationNotFoundError(integration_id)
        if integration.credentials_enc is None:
            return False
        connector = get_connector(integration.source_type)
        if connector is None:
            return False
        credentials = decrypt_credentials(integration.credentials_enc)
        return await connector.test_connection(credentials)

    async def fetch_schema(self, source_type: str, credentials: dict[str, str]) -> list[dict[str, Any]]:
        connector = get_connector(source_type)
        if connector is None:
            return []
        return await connector.fetch_schema(credentials)

    async def list_events(
        self, integration_id: str, limit: int = 50
    ) -> list[IntegrationEventResponse]:
        integration = await self._repository.get_by_id(integration_id)
        if integration is None:
            raise IntegrationNotFoundError(integration_id)
        return await self._repository.list_events(integration_id, limit)
