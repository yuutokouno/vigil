# backend/app/connectors/notion/polling.py
import logging
from datetime import timezone as _tz

from app.connectors.encryption import decrypt_credentials
from app.connectors.notion.handler import NotionConnector
from app.database import async_session
from app.repository.integration_repo import IntegrationRepository
from app.repository.postgres import PostgresBugRepository
from app.usecase.bug_usecase import BugUsecase

logger = logging.getLogger(__name__)


async def poll_notion_integrations() -> None:
    """Poll all active Notion integrations for new pages. Called by APScheduler."""
    async with async_session() as session:
        integration_repo = IntegrationRepository(session)
        bug_usecase = BugUsecase(PostgresBugRepository(session))
        connector = NotionConnector()

        integrations = await integration_repo.list_active_by_source("notion")
        for integration in integrations:
            try:
                credentials = decrypt_credentials(integration.credentials_enc)
                token = credentials.get("token", "")
                rules = integration.trigger_rules or {}
                database_id = rules.get("database_id", "")
                if not database_id:
                    continue

                last_ts = (
                    integration.last_received_at.astimezone(_tz.utc).isoformat()
                    if integration.last_received_at
                    else None
                )
                pages = await connector.query_database(token, database_id, last_ts)

                for page in pages:
                    page_id = page.get("id", "")
                    source_ref = f"notion:page:{page_id}"

                    if await integration_repo.is_duplicate(str(integration.id), source_ref):
                        continue

                    bug_create = await connector.transform(page, integration.field_mappings or [])
                    bug = await bug_usecase.create_bug(bug_create)
                    await integration_repo.log_event(
                        str(integration.id), "created",
                        source_ref=source_ref, bug_id=str(bug.id)
                    )
                    logger.info("Notion page %s → Bug %s created", page_id, bug.id)

            except Exception as e:
                logger.exception("Notion polling failed for integration %s: %s", integration.id, e)
