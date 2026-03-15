# backend/app/connectors/notion/handler.py
import logging

import httpx
from fastapi import Request

from app.infrastructure.connectors.base import ConnectorABC
from app.domain.schemas import BugCreate, Category, Priority, Severity, Source

logger = logging.getLogger(__name__)

NOTION_API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


class NotionConnector(ConnectorABC):

    async def verify_request(self, request: Request, body: bytes) -> bool:
        return True  # Notion uses polling, not push webhooks

    async def should_process(self, event_data: dict, trigger_rules: dict) -> bool:
        # Notion uses polling; page filtering is handled in query_database via Notion API filters.
        # All pages returned by query_database are processed.
        return True

    async def transform(self, event_data: dict, field_mappings: list[dict]) -> BugCreate:
        """Convert a Notion page object to BugCreate, applying field_mappings."""
        props = event_data.get("properties", {})
        page_id = event_data.get("id", "")

        def extract_prop(prop_name: str) -> str | None:
            """Extract a plain-text value from a Notion property by name."""
            prop = props.get(prop_name)
            if not prop:
                return None
            ptype = prop.get("type")
            if ptype == "title":
                items = prop.get("title", [])
                return "".join(t.get("plain_text", "") for t in items) or None
            elif ptype == "rich_text":
                items = prop.get("rich_text", [])
                return "".join(t.get("plain_text", "") for t in items) or None
            elif ptype == "select":
                sel = prop.get("select")
                return sel.get("name") if sel else None
            elif ptype == "multi_select":
                items = prop.get("multi_select", [])
                return ", ".join(i.get("name", "") for i in items) or None
            elif ptype == "date":
                date_obj = prop.get("date")
                return date_obj.get("start") if date_obj else None
            elif ptype == "number":
                n = prop.get("number")
                return str(n) if n is not None else None
            elif ptype == "url":
                return prop.get("url")
            elif ptype == "email":
                return prop.get("email")
            elif ptype == "phone_number":
                return prop.get("phone_number")
            elif ptype == "checkbox":
                return "true" if prop.get("checkbox") else "false"
            return None

        # Notion value → VIGIL Severity
        _SEVERITY_MAP: dict[str, Severity] = {
            "critical": Severity.CRITICAL, "Critical": Severity.CRITICAL,
            "high": Severity.HIGH, "High": Severity.HIGH,
            "medium": Severity.MEDIUM, "Medium": Severity.MEDIUM,
            "normal": Severity.MEDIUM, "Normal": Severity.MEDIUM,
            "low": Severity.LOW, "Low": Severity.LOW,
        }

        # Notion value → VIGIL Priority
        _PRIORITY_MAP: dict[str, Priority] = {
            "p0": Priority.P0, "P0": Priority.P0,
            "p1": Priority.P1, "P1": Priority.P1,
            "p2": Priority.P2, "P2": Priority.P2,
            "p3": Priority.P3, "P3": Priority.P3,
        }

        # Notion value → VIGIL Category
        _CATEGORY_MAP: dict[str, Category] = {
            "ui": Category.UI, "UI": Category.UI,
            "api": Category.API, "API": Category.API,
            "type_error": Category.TYPE_ERROR,
            "auth": Category.AUTH, "Auth": Category.AUTH,
            "data": Category.DATA, "Data": Category.DATA,
            "performance": Category.PERFORMANCE, "Performance": Category.PERFORMANCE,
            "other": Category.OTHER, "Other": Category.OTHER,
        }

        # Defaults
        title = ""
        description: str | None = None
        severity: Severity = Severity.MEDIUM
        priority: Priority = Priority.P2
        category: Category | None = None
        version: str | None = None

        if field_mappings:
            # Apply custom mappings from integration config
            for mapping in field_mappings:
                src: str = mapping.get("from", "")
                dst: str = mapping.get("to", "")
                if not src or not dst:
                    continue

                if src.startswith("fixed_value:"):
                    value: str | None = src.split(":", 1)[1]
                elif src.startswith("properties."):
                    prop_name = src.split(".", 1)[1]
                    value = extract_prop(prop_name)
                else:
                    value = extract_prop(src)

                if value is None:
                    continue

                if dst == "title":
                    title = value[:200]
                elif dst == "description":
                    description = value
                elif dst == "severity":
                    severity = _SEVERITY_MAP.get(value, Severity.MEDIUM)
                elif dst == "priority":
                    priority = _PRIORITY_MAP.get(value, Priority.P2)
                elif dst == "category":
                    category = _CATEGORY_MAP.get(value)
                elif dst == "version":
                    version = value
        else:
            # V1 fallback: auto-detect title by property type, description by common names
            for name, prop in props.items():
                if prop.get("type") == "title" and not title:
                    title = extract_prop(name) or ""
                elif name.lower() in ("description", "desc", "content", "説明") and not description:
                    description = extract_prop(name)

        if not title:
            title = f"Notion page {page_id[:8]}"

        return BugCreate(
            title=title,
            description=description,
            severity=severity,
            priority=priority,
            category=category,
            version=version,
            source=Source.NOTION,
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
            {"key": "properties.Name", "label": "ページタイトル (Name)"},
            {"key": "properties.Description", "label": "説明 (Description)"},
            {"key": "properties.Status", "label": "ステータス (Status)"},
            {"key": "properties.Priority", "label": "優先度 (Priority)"},
            {"key": "properties.Severity", "label": "重大度 (Severity)"},
            {"key": "properties.Type", "label": "タイプ (Type)"},
            {"key": "properties.Version", "label": "バージョン (Version)"},
        ]

    async def query_database(
        self,
        token: str,
        database_id: str,
        last_edited_after: str | None = None,
        trigger_rules: dict | None = None,
    ) -> list[dict]:
        """Query Notion database with optional time-based and property filters."""
        headers = {
            "Authorization": f"Bearer {token}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        }

        filter_conditions: list[dict] = []

        # Incremental sync: only pages edited after the last poll timestamp
        if last_edited_after:
            filter_conditions.append({
                "timestamp": "last_edited_time",
                "last_edited_time": {"after": last_edited_after},
            })

        # trigger_rules-based property filters
        if trigger_rules:
            # Single-value select filter (e.g. Status == "Bug")
            status_field = trigger_rules.get("filter_by_status_field")
            status_value = trigger_rules.get("filter_by_status_value")
            if status_field and status_value:
                filter_conditions.append({
                    "property": status_field,
                    "select": {"equals": status_value},
                })

            # Multi-select OR filter (e.g. Type contains "Bug" or "Issue")
            type_field = trigger_rules.get("filter_by_type_field")
            type_values = trigger_rules.get("filter_by_type_values")
            if type_field and type_values:
                values_list = type_values if isinstance(type_values, list) else [type_values]
                type_conditions = [
                    {"property": type_field, "multi_select": {"contains": v}}
                    for v in values_list
                ]
                if len(type_conditions) == 1:
                    filter_conditions.append(type_conditions[0])
                else:
                    filter_conditions.append({"or": type_conditions})

        body: dict = {"page_size": 100}
        if len(filter_conditions) == 1:
            body["filter"] = filter_conditions[0]
        elif len(filter_conditions) > 1:
            body["filter"] = {"and": filter_conditions}

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
                resp = await client.patch(
                    f"{NOTION_API}/pages/{page_id}",
                    headers=headers,
                    json={"properties": properties},
                )
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "Failed to update Notion page %s: HTTP %s %s",
                    page_id,
                    exc.response.status_code,
                    exc.response.text,
                )
            except httpx.HTTPError as exc:
                logger.warning("Failed to update Notion page %s: %s", page_id, exc)
