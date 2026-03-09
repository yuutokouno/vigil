# backend/app/connectors/notion/handler.py
import logging

import httpx
from fastapi import Request

from app.connectors.base import ConnectorABC
from app.domain.schemas import BugCreate, Priority, Severity, Source

logger = logging.getLogger(__name__)

NOTION_API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


class NotionConnector(ConnectorABC):

    async def verify_request(self, request: Request, body: bytes) -> bool:
        return True  # Notion uses polling, not push webhooks

    async def should_process(self, event_data: dict, trigger_rules: dict) -> bool:
        # Notion uses polling; page filtering is handled in polling.py by database_id selection.
        # All pages returned by query_database are processed.
        return True

    async def transform(self, event_data: dict, field_mappings: list[dict]) -> BugCreate:
        """Convert a Notion page object to BugCreate."""
        # field_mappings are intentionally unused in V1; Notion fields are mapped by property type.
        props = event_data.get("properties", {})

        def get_title(prop: dict) -> str:
            items = prop.get("title", [])
            return "".join(t.get("plain_text", "") for t in items)

        def get_rich_text(prop: dict) -> str:
            items = prop.get("rich_text", [])
            return "".join(t.get("plain_text", "") for t in items)

        def get_select(prop: dict) -> str:
            sel = prop.get("select") or {}
            return sel.get("name", "")

        # Default mapping: find "Name"/"Title" → title, "Description" → description
        title = ""
        description = ""
        for key, val in props.items():
            if val.get("type") == "title":
                title = get_title(val)
            elif key.lower() in ("description", "content", "説明"):
                description = get_rich_text(val)

        page_id = event_data.get("id", "")

        return BugCreate(
            title=title or "Notion Page",
            description=description,
            source=Source.NOTION,
            severity=Severity.MEDIUM,
            priority=Priority.P2,
            external_ref=f"notion:page:{page_id}",
        )

    async def test_connection(self, credentials: dict) -> bool:
        token = credentials.get("token", "")
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    f"{NOTION_API}/users/me",
                    headers={"Authorization": f"Bearer {token}", "Notion-Version": NOTION_VERSION},
                )
                return resp.status_code == 200
            except httpx.HTTPError:
                return False

    async def fetch_schema(self, credentials: dict) -> list[dict]:
        """Return generic Notion page property fields."""
        return [
            {"key": "properties.Name.title", "label": "ページタイトル"},
            {"key": "properties.Description.rich_text", "label": "説明"},
            {"key": "properties.Status.select", "label": "ステータス"},
        ]

    async def query_database(
        self, token: str, database_id: str, last_edited_after: str | None = None
    ) -> list[dict]:
        headers = {
            "Authorization": f"Bearer {token}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        }
        body: dict = {"page_size": 100}
        if last_edited_after:
            body["filter"] = {
                "timestamp": "last_edited_time",
                "last_edited_time": {"after": last_edited_after},
            }
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(
                    f"{NOTION_API}/databases/{database_id}/query",
                    headers=headers,
                    json=body,
                )
                resp.raise_for_status()
                data = resp.json()
                return data.get("results", [])
            except httpx.HTTPError as exc:
                logger.warning("Notion query_database failed for database %s: %s", database_id, exc)
                return []

    async def update_page(self, token: str, page_id: str, properties: dict) -> None:
        headers = {
            "Authorization": f"Bearer {token}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                await client.patch(
                    f"{NOTION_API}/pages/{page_id}",
                    headers=headers,
                    json={"properties": properties},
                )
            except httpx.HTTPError as exc:
                logger.warning("Failed to update Notion page %s: %s", page_id, exc)
