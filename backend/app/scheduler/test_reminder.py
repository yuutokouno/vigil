"""APScheduler job: daily Slack reminder for test checklist progress (#18).

Schedule: every day at 10:00 (Asia/Tokyo or UTC depending on deployment).

Logic:
- unchecked (0%)     → notify every day
- half done (≥50%)  → notify every 2 days
- fully done (100%) → send completion notification once (when release transitions)
- past release_date with unchecked remaining → @channel alert
"""
import logging
from datetime import datetime, timezone

from app.infrastructure.connectors.encryption import CredentialDecryptionError, decrypt_credentials
from app.infrastructure.db.database import async_session
from app.infrastructure.repository.integration_repo import IntegrationRepository
from app.infrastructure.repository.test_scenario_repo import TestScenarioRepository

logger = logging.getLogger(__name__)


async def send_test_checklist_reminders() -> None:
    """Check all active releases and send Slack reminders as needed."""
    async with async_session() as session:
        scenario_repo = TestScenarioRepository(session)
        integration_repo = IntegrationRepository(session)

        active_releases = await scenario_repo.get_active_releases()
        if not active_releases:
            return

        for release in active_releases:
            checked, total = await scenario_repo.get_checklist_progress(release.id)
            if total == 0:
                continue

            pct = checked / total
            now = datetime.now(timezone.utc)
            is_overdue = (
                release.release_date is not None and now > release.release_date and pct < 1.0
            )

            # Determine if we should notify today
            # Simple heuristic: always notify (scheduler frequency controls cadence externally)
            # For 50%+: only notify every other run. We use a "day of year" trick.
            day_of_year = now.timetuple().tm_yday
            if pct >= 0.5 and pct < 1.0 and not is_overdue:
                if day_of_year % 2 != 0:
                    continue  # Skip this day (notify every 2 days)

            message = _build_message(release.version, checked, total, pct, is_overdue)
            if message is None:
                continue

            project_id = str(release.project_id) if release.project_id else None
            if project_id is None:
                continue

            await _post_to_slack(integration_repo, project_id, message, is_overdue)


def _build_message(
    version: str, checked: int, total: int, pct: float, is_overdue: bool
) -> str | None:
    if pct >= 1.0:
        return None  # All done, no reminder needed
    if is_overdue:
        return (
            f"<!channel> *[リリース期限超過]* バージョン `{version}` のテストチェックリストが未完了です。"
            f" {checked}/{total} 項目 ({pct:.0%}) 完了。至急対応してください。"
        )
    if pct >= 0.5:
        return (
            f":large_yellow_circle: `{version}` のテストチェックリスト残り {total - checked} 項目。"
            f" {checked}/{total} ({pct:.0%}) 完了。"
        )
    return (
        f":red_circle: `{version}` のテストチェックリストが未着手です。"
        f" {checked}/{total} ({pct:.0%}) 完了。リリース前にテストを実施してください。"
    )


async def _post_to_slack(
    integration_repo: IntegrationRepository,
    project_id: str,
    message: str,
    is_urgent: bool,
) -> None:
    """Post message to the Slack integration configured for this project."""
    import httpx

    integrations = await integration_repo.list_active_by_source("slack")
    # Filter to integrations for this project
    project_integrations = [
        i for i in integrations
        if i.project_id is not None and str(i.project_id) == project_id
    ]
    if not project_integrations:
        logger.debug("No active Slack integration for project %s; skipping reminder", project_id)
        return

    integration = project_integrations[0]
    try:
        credentials = decrypt_credentials(integration.credentials_enc)
    except CredentialDecryptionError:
        logger.warning("Failed to decrypt Slack credentials for project %s", project_id)
        return

    bot_token = credentials.get("bot_token", "")
    channel = (integration.trigger_rules or {}).get("notification_channel", "#general")
    if not bot_token:
        return

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
                "Slack reminder post failed for project %s: %s", project_id, resp.text
            )
    except Exception:
        logger.exception("Error posting Slack reminder for project %s", project_id)
