# backend/app/connectors/hubspot/polling.py
import logging
from datetime import datetime, timezone

import httpx

from app.connectors.encryption import CredentialDecryptionError, decrypt_credentials
from app.connectors.hubspot.handler import HubSpotConnector
from app.database import async_session
from app.repository.integration_repo import IntegrationRepository
from app.repository.postgres import PostgresBugRepository
from app.usecase.bug_usecase import BugUsecase

logger = logging.getLogger(__name__)

HUBSPOT_API = "https://api.hubapi.com"

# Properties fetched from HubSpot CRM tickets endpoint
_TICKET_PROPERTIES = [
    "subject",
    "content",
    "hs_ticket_priority",
    "hs_pipeline_stage",
    "createdate",
    "hs_lastmodifieddate",
]


async def _fetch_tickets_updated_since(
    access_token: str, updated_after_ms: int | None
) -> list[dict]:
    """Fetch HubSpot tickets updated after the given Unix timestamp in milliseconds.

    Uses the CRM search endpoint to filter by hs_lastmodifieddate.
    Returns a list of ticket objects in the same shape as webhook payloads
    (i.e., {"objectId": ..., "properties": {...}}).
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    filters = []
    if updated_after_ms is not None:
        filters.append(
            {
                "propertyName": "hs_lastmodifieddate",
                "operator": "GT",
                "value": str(updated_after_ms),
            }
        )

    search_body = {
        "filterGroups": [{"filters": filters}] if filters else [],
        "properties": _TICKET_PROPERTIES,
        "limit": 100,
        "sorts": [{"propertyName": "hs_lastmodifieddate", "direction": "ASCENDING"}],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{HUBSPOT_API}/crm/v3/objects/tickets/search",
                headers=headers,
                json=search_body,
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            # Normalize to the same shape that the webhook handler expects:
            # {"objectId": "...", "properties": {...}}
            return [
                {"objectId": ticket["id"], "properties": ticket.get("properties", {})}
                for ticket in results
            ]
    except httpx.HTTPError as exc:
        logger.warning("HubSpot ticket fetch failed: %s", exc)
        return []


async def poll_hubspot_integrations() -> None:
    """Poll all active HubSpot integrations for updated tickets. Called by APScheduler."""
    async with async_session() as session:
        integration_repo = IntegrationRepository(session)
        bug_usecase = BugUsecase(PostgresBugRepository(session))
        connector = HubSpotConnector()

        integrations = await integration_repo.list_active_by_source("hubspot")
        for integration in integrations:
            try:
                if integration.credentials_enc is None:
                    logger.warning(
                        "HubSpot integration %s has no credentials; skipping", integration.id
                    )
                    continue

                try:
                    credentials = decrypt_credentials(integration.credentials_enc)
                except CredentialDecryptionError:
                    logger.error(
                        "HubSpot integration %s: credential decryption failed; skipping",
                        integration.id,
                    )
                    await integration_repo.log_event(
                        str(integration.id),
                        "error",
                        error_message="credential_decryption_failed",
                    )
                    continue

                access_token = credentials.get("access_token", "")
                if not access_token:
                    logger.warning(
                        "HubSpot integration %s has no access_token; skipping", integration.id
                    )
                    continue

                # Convert last_received_at to milliseconds epoch for HubSpot filter
                updated_after_ms: int | None = None
                if integration.last_received_at:
                    dt = integration.last_received_at
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    updated_after_ms = int(dt.timestamp() * 1000)

                tickets = await _fetch_tickets_updated_since(access_token, updated_after_ms)

                for ticket in tickets:
                    raw_ticket_id = str(ticket.get("objectId", ""))
                    if not raw_ticket_id:
                        continue

                    source_ref = f"hubspot:ticket:{raw_ticket_id}"

                    if await integration_repo.is_duplicate(str(integration.id), source_ref):
                        continue

                    if not await connector.should_process(ticket, integration.trigger_rules or {}):
                        continue

                    bug_create = await connector.transform(
                        ticket, integration.field_mappings or []
                    )
                    bug = await bug_usecase.create_bug(bug_create)
                    await integration_repo.log_event(
                        str(integration.id),
                        "created",
                        source_ref=source_ref,
                        bug_id=str(bug.id),
                    )
                    logger.info(
                        "HubSpot ticket %s → Bug %s created", raw_ticket_id, bug.id
                    )

            except Exception:
                logger.exception(
                    "HubSpot polling failed for integration %s", integration.id
                )
