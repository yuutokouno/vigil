# backend/app/repository/integration_repo.py
import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.encryption import encrypt_credentials, decrypt_credentials
from app.domain.models import Integration, IntegrationEvent
from app.domain.schemas import (
    IntegrationCreate,
    IntegrationEventResponse,
    IntegrationResponse,
    IntegrationUpdate,
)


class IntegrationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, data: IntegrationCreate) -> IntegrationResponse:
        enc = encrypt_credentials(data.credentials)
        integration = Integration(
            name=data.name,
            source_type=data.source_type,
            direction=data.direction,
            credentials_enc=enc,
            trigger_rules=data.trigger_rules,
            field_mappings=data.field_mappings,
        )
        self._session.add(integration)
        await self._session.commit()
        await self._session.refresh(integration)
        return self._to_response(integration)

    async def get_by_id(self, integration_id: str) -> Integration | None:
        return await self._session.get(Integration, uuid.UUID(integration_id))

    async def get_response_by_id(self, integration_id: str) -> IntegrationResponse | None:
        integration = await self.get_by_id(integration_id)
        if integration is None:
            return None
        return self._to_response(integration)

    async def list_all(self) -> list[IntegrationResponse]:
        result = await self._session.execute(select(Integration))
        return [self._to_response(i) for i in result.scalars().all()]

    async def list_active_by_source(self, source_type: str) -> list[Integration]:
        result = await self._session.execute(
            select(Integration).where(
                Integration.source_type == source_type,
                Integration.is_active.is_(True),
            )
        )
        return list(result.scalars().all())

    async def update(self, integration: Integration, data: IntegrationUpdate) -> IntegrationResponse:
        if data.name is not None:
            integration.name = data.name
        if data.is_active is not None:
            integration.is_active = data.is_active
        if data.credentials is not None:
            integration.credentials_enc = encrypt_credentials(data.credentials)
        if data.trigger_rules is not None:
            integration.trigger_rules = data.trigger_rules
        if data.field_mappings is not None:
            integration.field_mappings = data.field_mappings
        await self._session.commit()
        await self._session.refresh(integration)
        return self._to_response(integration)

    async def delete(self, integration: Integration) -> None:
        await self._session.delete(integration)
        await self._session.commit()

    async def log_event(
        self,
        integration_id: str,
        status: str,
        direction: str = "inbound",
        source_ref: str | None = None,
        bug_id: str | None = None,
        error_message: str | None = None,
    ) -> None:
        event = IntegrationEvent(
            integration_id=uuid.UUID(integration_id),
            direction=direction,
            status=status,
            source_ref=source_ref,
            bug_id=uuid.UUID(bug_id) if bug_id else None,
            error_message=error_message,
        )
        self._session.add(event)
        if status == "created":
            # Use atomic SQL UPDATE to avoid read-then-increment race condition
            await self._session.execute(
                update(Integration)
                .where(Integration.id == uuid.UUID(integration_id))
                .values(
                    total_received=Integration.total_received + 1,
                    last_received_at=func.now(),
                )
            )
        await self._session.commit()

    async def is_duplicate(self, integration_id: str, source_ref: str) -> bool:
        result = await self._session.execute(
            select(IntegrationEvent).where(
                IntegrationEvent.integration_id == uuid.UUID(integration_id),
                IntegrationEvent.source_ref == source_ref,
                IntegrationEvent.status == "created",
            )
        )
        return result.scalar_one_or_none() is not None

    async def list_events(
        self, integration_id: str, limit: int = 50
    ) -> list[IntegrationEventResponse]:
        result = await self._session.execute(
            select(IntegrationEvent)
            .where(IntegrationEvent.integration_id == uuid.UUID(integration_id))
            .order_by(IntegrationEvent.created_at.desc())
            .limit(limit)
        )
        return [self._event_to_response(e) for e in result.scalars().all()]

    def _to_response(self, i: Integration) -> IntegrationResponse:
        return IntegrationResponse(
            id=str(i.id),
            name=i.name,
            source_type=i.source_type,
            direction=i.direction,
            is_active=i.is_active,
            trigger_rules=i.trigger_rules or {},
            field_mappings=i.field_mappings or [],
            last_received_at=i.last_received_at,
            total_received=i.total_received,
            created_at=i.created_at,
        )

    def _event_to_response(self, e: IntegrationEvent) -> IntegrationEventResponse:
        return IntegrationEventResponse(
            id=str(e.id),
            integration_id=str(e.integration_id),
            direction=e.direction,
            status=e.status,
            source_ref=e.source_ref,
            bug_id=str(e.bug_id) if e.bug_id else None,
            error_message=e.error_message,
            created_at=e.created_at,
        )
