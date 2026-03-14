# backend/app/infrastructure/connectors/notion/polling.py
import logging
from datetime import datetime, timezone

from app.infrastructure.connectors.encryption import CredentialDecryptionError, decrypt_credentials
from app.infrastructure.connectors.notion.handler import NotionConnector
from app.infrastructure.db.database import async_session
from app.infrastructure.repository.integration_repo import IntegrationRepository
from app.infrastructure.repository.postgres import PostgresBugRepository
from app.usecase.bug_usecase import BugUsecase

logger = logging.getLogger(__name__)


def _to_utc_isoformat(dt: datetime) -> str:
    """Convert a datetime to a UTC ISO 8601 string accepted by the Notion API.

    Handles both timezone-aware and timezone-naive datetimes safely.
    Naive datetimes are assumed to be UTC (consistent with PostgreSQL TIMESTAMP WITH TIME ZONE
    returning UTC-aware values, but guarding against edge cases).
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


async def poll_notion_integrations() -> None:
    """Poll all active Notion integrations for new pages. Called by APScheduler."""
    async with async_session() as session:
        integration_repo = IntegrationRepository(session)
        bug_usecase = BugUsecase(PostgresBugRepository(session))
        connector = NotionConnector()

        integrations = await integration_repo.list_active_by_source("notion")
        for integration in integrations:
            try:
                if integration.credentials_enc is None:
                    logger.warning(
                        "Notion integration %s has no credentials; skipping", integration.id
                    )
                    continue

                try:
                    credentials = decrypt_credentials(integration.credentials_enc)
                except CredentialDecryptionError:
                    logger.error(
                        "Notion integration %s: credential decryption failed; skipping",
                        integration.id,
                    )
                    await integration_repo.log_event(
                        str(integration.id),
                        "error",
                        error_message="credential_decryption_failed",
                    )
                    continue

                token = credentials.get("token", "")
                rules = integration.trigger_rules or {}
                database_id = rules.get("database_id", "")
                if not database_id:
                    logger.debug(
                        "Notion integration %s has no database_id in trigger_rules; skipping",
                        integration.id,
                    )
                    continue

                last_ts = (
                    _to_utc_isoformat(integration.last_received_at)
                    if integration.last_received_at
                    else None
                )
                pages = await connector.query_database(token, database_id, last_ts)

                for page in pages:
                    page_id = page.get("id", "")
                    if not page_id:
                        continue
                    source_ref = f"notion:page:{page_id}"

                    if await integration_repo.is_duplicate(str(integration.id), source_ref):
                        continue

                    bug_create = await connector.transform(page, integration.field_mappings or [])
                    bug = await bug_usecase.create_bug(bug_create)
                    await integration_repo.log_event(
                        str(integration.id),
                        "created",
                        source_ref=source_ref,
                        bug_id=str(bug.id),
                    )
                    logger.info("Notion page %s → Bug %s created", page_id, bug.id)

            except Exception:
                logger.exception(
                    "Notion polling failed for integration %s", integration.id
                )
