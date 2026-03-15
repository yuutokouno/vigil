"""APScheduler job: Stop the Line quality gate check.

Schedule: every 30 minutes.

Logic:
- Counts open critical and high bugs per project.
- If either count meets or exceeds the configured threshold, the line is stopped.
- A Slack notification is sent at most once per 4-hour window to avoid spam.
- Each triggering event is persisted to stop_the_line_events for audit purposes.
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.infrastructure.connectors.encryption import CredentialDecryptionError, decrypt_credentials
from app.infrastructure.db.database import async_session
from app.domain.models import Bug, Integration, StopTheLineEvent

logger = logging.getLogger(__name__)

_DEFAULT_THRESHOLD_CRITICAL = 3
_DEFAULT_THRESHOLD_HIGH = 10
_NOTIFICATION_COOLDOWN_HOURS = 4


async def check_stop_the_line() -> None:
    """Check all active projects for stop-the-line conditions and notify Slack."""
    async with async_session() as session:
        integrations = (
            await session.execute(
                select(Integration).where(
                    Integration.source_type == "slack",
                    Integration.is_active.is_(True),
                    Integration.project_id.isnot(None),
                )
            )
        ).scalars().all()

        for integration in integrations:
            pid = integration.project_id
            rules = integration.trigger_rules or {}
            threshold_critical = int(rules.get("stop_the_line_critical", _DEFAULT_THRESHOLD_CRITICAL))
            threshold_high = int(rules.get("stop_the_line_high", _DEFAULT_THRESHOLD_HIGH))

            critical_count = await session.scalar(
                select(func.count()).where(
                    Bug.project_id == pid,
                    Bug.severity == "critical",
                    Bug.status != "closed",
                )
            ) or 0
            high_count = await session.scalar(
                select(func.count()).where(
                    Bug.project_id == pid,
                    Bug.severity == "high",
                    Bug.status != "closed",
                )
            ) or 0

            is_triggered = (critical_count >= threshold_critical) or (high_count >= threshold_high)
            if not is_triggered:
                continue

            # Suppress repeat notifications within the cooldown window.
            cooldown_cutoff = datetime.now(timezone.utc) - timedelta(hours=_NOTIFICATION_COOLDOWN_HOURS)
            recent_event_count = await session.scalar(
                select(func.count()).where(
                    StopTheLineEvent.project_id == pid,
                    StopTheLineEvent.triggered_at > cooldown_cutoff,
                )
            ) or 0
            if recent_event_count > 0:
                logger.debug(
                    "Stop the Line already triggered for project %s within cooldown window; skipping",
                    pid,
                )
                continue

            # Persist the event before attempting notification so it is always recorded.
            event = StopTheLineEvent(
                project_id=pid,
                critical_count=critical_count,
                high_count=high_count,
                threshold_critical=threshold_critical,
                threshold_high=threshold_high,
            )
            session.add(event)
            await session.commit()

            channel = rules.get("notification_channel", "")
            if not channel:
                logger.debug(
                    "No notification_channel configured for project %s; skipping Slack post", pid
                )
                continue

            await _post_to_slack(integration, channel, critical_count, high_count, threshold_critical, threshold_high)


async def _post_to_slack(
    integration: Integration,
    channel: str,
    critical_count: int,
    high_count: int,
    threshold_critical: int,
    threshold_high: int,
) -> None:
    """Post a stop-the-line alert to the configured Slack channel."""
    import httpx

    try:
        credentials = decrypt_credentials(integration.credentials_enc)
    except CredentialDecryptionError:
        logger.warning(
            "Failed to decrypt Slack credentials for project %s; skipping notification",
            integration.project_id,
        )
        return

    bot_token = credentials.get("bot_token", "")
    if not bot_token:
        return

    message = (
        f":rotating_light: *Stop the Line!*\n"
        f"Open critical bugs: *{critical_count}* (threshold: {threshold_critical})\n"
        f"Open high bugs: *{high_count}* (threshold: {threshold_high})\n"
        f"Review and resolve critical/high bugs before continuing new work."
    )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://slack.com/api/chat.postMessage",
                json={"channel": channel, "text": message},
                headers={"Authorization": f"Bearer {bot_token}"},
                timeout=10,
            )
        if not resp.json().get("ok"):
            logger.warning(
                "Stop the Line Slack post failed for project %s: %s",
                integration.project_id,
                resp.text,
            )
    except Exception:
        logger.exception(
            "Error posting Stop the Line notification for project %s",
            integration.project_id,
        )
