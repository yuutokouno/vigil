# backend/app/connectors/hubspot/handler.py
from typing import Any

import httpx
from fastapi import Request

from app.connectors.base import ConnectorABC
from app.domain.schemas import BugCreate, Priority, Severity, Source

HUBSPOT_API = "https://api.hubapi.com"

SEVERITY_MAP: dict[str, Severity] = {
    "HIGH": Severity.HIGH,
    "MEDIUM": Severity.MEDIUM,
    "LOW": Severity.LOW,
    # HubSpot also emits "URGENT"; treat as HIGH severity.
    "URGENT": Severity.HIGH,
}


def _extract_prop(prop: Any) -> str:
    """Extract a string value from a HubSpot property.

    HubSpot webhook properties can be a dict with a 'value' key or a plain string.
    Returns an empty string for None or missing values.
    """
    if isinstance(prop, dict):
        return str(prop.get("value", ""))
    return str(prop or "")


class HubSpotConnector(ConnectorABC):

    async def verify_request(self, request: Request, body: bytes) -> bool:
        # HubSpot workflow webhooks don't have built-in signatures in basic tier.
        # For production, compare source IP or use a shared secret in URL param.
        return True

    async def should_process(self, event_data: dict, trigger_rules: dict) -> bool:
        properties: dict[str, Any] = event_data.get("properties", {})

        # Status filter
        allowed_statuses: list[str] = trigger_rules.get("ticket_status", [])
        if allowed_statuses:
            ticket_status = _extract_prop(properties.get("hs_pipeline_stage", ""))
            if ticket_status not in allowed_statuses:
                return False

        # Priority filter
        allowed_priorities: list[str] = trigger_rules.get("priority", [])
        if allowed_priorities:
            ticket_priority = _extract_prop(properties.get("hs_ticket_priority", ""))
            if ticket_priority not in allowed_priorities:
                return False

        # Keyword filter
        keywords: list[str] = trigger_rules.get("keywords", [])
        if keywords:
            subject = _extract_prop(properties.get("subject", ""))
            content = _extract_prop(properties.get("content", ""))
            text = f"{subject} {content}".lower()
            return any(kw.lower() in text for kw in keywords)

        return True

    async def transform(self, event_data: dict, field_mappings: list[dict]) -> BugCreate:
        # field_mappings are intentionally unused in V1; HubSpot fields are mapped statically.
        properties: dict[str, Any] = event_data.get("properties", {})

        subject = _extract_prop(properties.get("subject", "")) or "HubSpot Ticket"
        content = _extract_prop(properties.get("content", ""))
        hs_priority = _extract_prop(properties.get("hs_ticket_priority", "")).upper()
        ticket_id = str(event_data.get("objectId", ""))

        return BugCreate(
            title=subject[:200],
            description=content or None,
            reported_by="customer",
            source=Source.HUBSPOT,
            severity=SEVERITY_MAP.get(hs_priority, Severity.MEDIUM),
            priority=Priority.P2,
            external_ref=f"hubspot:ticket:{ticket_id}",
        )

    async def test_connection(self, credentials: dict) -> bool:
        token = credentials.get("access_token", "")
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    f"{HUBSPOT_API}/crm/v3/objects/tickets",
                    headers={"Authorization": f"Bearer {token}"},
                    params={"limit": "1"},
                )
                return resp.status_code == 200
            except httpx.HTTPError:
                # Covers ConnectError, TimeoutException, and all transport-level failures.
                return False

    async def fetch_schema(self, credentials: dict) -> list[dict]:
        return [
            {"key": "properties.subject", "label": "チケット件名"},
            {"key": "properties.content", "label": "チケット内容"},
            {"key": "properties.hs_ticket_priority", "label": "優先度 (HIGH/MEDIUM/LOW)"},
            {"key": "properties.hs_pipeline_stage", "label": "ステータス"},
        ]
