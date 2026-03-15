# backend/app/presentation/webhooks.py
import logging

from fastapi import APIRouter, Depends, Request

from app.di.bug import get_bug_usecase
from app.di.integration import get_integration_repo
from app.infrastructure.connectors.encryption import CredentialDecryptionError, decrypt_credentials
from app.infrastructure.connectors.registry import get_connector
from app.infrastructure.connectors.slack.handler import SlackConnector
from app.infrastructure.repository.integration_repo import IntegrationRepository
from app.usecase.bug_usecase import BugUsecase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/slack")
async def slack_webhook(
    request: Request,
    bug_usecase: BugUsecase = Depends(get_bug_usecase),
    integration_repo: IntegrationRepository = Depends(get_integration_repo),
) -> dict:
    body = await request.body()
    json_body = await request.json()

    # Handle Slack URL verification challenge (initial setup handshake).
    # This is intentionally processed before signature verification since Slack sends
    # this challenge before the integration is fully configured. Returning the challenge
    # value poses no security risk as it only echoes back data the caller provided.
    if json_body.get("type") == "url_verification":
        return {"challenge": json_body["challenge"]}

    # Load active Slack integrations
    integrations = await integration_repo.list_active_by_source("slack")
    if not integrations:
        return {"ok": True, "action": "no_active_integration"}

    event = json_body.get("event", {})
    results = []

    for integration in integrations:
        try:
            credentials = decrypt_credentials(integration.credentials_enc)
        except CredentialDecryptionError:
            await integration_repo.log_event(
                str(integration.id), "error", error_message="credential_decryption_failed"
            )
            results.append("error")
            continue
        connector = SlackConnector(
            bot_token=credentials.get("bot_token", ""),
            signing_secret=credentials.get("signing_secret", ""),
        )

        # Verify signature
        if not await connector.verify_request(request, body):
            await integration_repo.log_event(
                str(integration.id), "error", error_message="signature_verification_failed"
            )
            continue

        # Check trigger rules
        if not await connector.should_process(event, integration.trigger_rules or {}):
            await integration_repo.log_event(str(integration.id), "skipped")
            results.append("skipped")
            continue

        # For reaction_added, fetch the original message.
        # get_message is now safe and returns {} on failure rather than raising.
        event_data = event
        if event.get("type") == "reaction_added":
            item = event.get("item", {})
            message = await connector.client.get_message(
                channel=item.get("channel", ""),
                ts=item.get("ts", ""),
            )
            if not message:
                # Could not retrieve the original message; log and skip this event.
                logger.warning(
                    "reaction_added: could not fetch original message for integration=%s "
                    "channel=%s ts=%s",
                    integration.id,
                    item.get("channel"),
                    item.get("ts"),
                )
                await integration_repo.log_event(
                    str(integration.id),
                    "error",
                    error_message="reaction_added: original message fetch failed",
                )
                results.append("error")
                continue
            event_data = {
                **message,
                "channel": item.get("channel", ""),
                "user": event.get("user", ""),
            }

        # Deduplicate
        ts = str(event_data.get("ts", ""))
        channel = str(event_data.get("channel", ""))
        source_ref = f"{channel}:{ts}"
        if await integration_repo.is_duplicate(str(integration.id), source_ref):
            await integration_repo.log_event(str(integration.id), "duplicate", source_ref=source_ref)
            results.append("duplicate")
            continue

        # Transform and create bug
        try:
            bug_create = await connector.transform(event_data, integration.field_mappings or [])
            bug = await bug_usecase.create_bug(bug_create)
            await integration_repo.log_event(
                str(integration.id), "created", source_ref=source_ref, bug_id=str(bug.id)
            )
            results.append("created")
        except Exception as e:
            logger.exception(
                "Slack webhook: bug creation failed for integration=%s source_ref=%s",
                integration.id,
                source_ref,
            )
            await integration_repo.log_event(
                str(integration.id), "error", source_ref=source_ref, error_message=str(e)
            )
            results.append("error")
            continue

        # Best-effort Slack thread notification — failure must not change the created status.
        try:
            await connector.client.post_thread_message(
                channel=channel,
                thread_ts=ts,
                text=f"Vigilにバグチケットを作成しました: {bug.title}",
            )
        except Exception:
            pass  # Non-fatal: ticket was already created successfully

    return {"ok": True, "results": results}


@router.post("/hubspot")
async def hubspot_webhook(
    request: Request,
    bug_usecase: BugUsecase = Depends(get_bug_usecase),
    integration_repo: IntegrationRepository = Depends(get_integration_repo),
) -> dict:
    json_body = await request.json()

    integrations = await integration_repo.list_active_by_source("hubspot")
    if not integrations:
        return {"ok": True, "action": "no_active_integration"}

    results = []
    for integration in integrations:
        connector = get_connector("hubspot")
        if connector is None:
            continue

        if not await connector.should_process(json_body, integration.trigger_rules or {}):
            await integration_repo.log_event(str(integration.id), "skipped")
            results.append("skipped")
            continue

        # Use the same "hubspot:ticket:{id}" format as transform() produces for external_ref,
        # ensuring that is_duplicate, log_event, and external_ref are all consistent.
        raw_ticket_id = str(json_body.get("objectId", ""))
        source_ref = f"hubspot:ticket:{raw_ticket_id}" if raw_ticket_id else ""

        if source_ref and await integration_repo.is_duplicate(str(integration.id), source_ref):
            await integration_repo.log_event(
                str(integration.id), "duplicate", source_ref=source_ref
            )
            results.append("duplicate")
            continue

        try:
            bug_create = await connector.transform(json_body, integration.field_mappings or [])
            bug = await bug_usecase.create_bug(bug_create)
            await integration_repo.log_event(
                str(integration.id), "created", source_ref=source_ref, bug_id=str(bug.id)
            )
            results.append("created")
        except Exception as e:
            logger.exception(
                "HubSpot webhook: bug creation failed for integration=%s source_ref=%s",
                integration.id,
                source_ref,
            )
            await integration_repo.log_event(
                str(integration.id), "error", source_ref=source_ref, error_message=str(e)
            )
            results.append("error")

    return {"ok": True, "results": results}
