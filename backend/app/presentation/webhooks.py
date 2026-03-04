# backend/app/presentation/webhooks.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.encryption import CredentialDecryptionError, decrypt_credentials
from app.connectors.registry import get_connector
from app.connectors.slack.handler import SlackConnector
from app.database import get_session
from app.repository.integration_repo import IntegrationRepository
from app.repository.postgres import PostgresBugRepository
from app.usecase.bug_usecase import BugUsecase

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def _get_bug_usecase(session: AsyncSession = Depends(get_session)) -> BugUsecase:
    return BugUsecase(PostgresBugRepository(session))


def _get_integration_repo(session: AsyncSession = Depends(get_session)) -> IntegrationRepository:
    return IntegrationRepository(session)


@router.post("/slack")
async def slack_webhook(
    request: Request,
    bug_usecase: BugUsecase = Depends(_get_bug_usecase),
    integration_repo: IntegrationRepository = Depends(_get_integration_repo),
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

        # For reaction_added, fetch the original message
        event_data = event
        if event.get("type") == "reaction_added":
            item = event.get("item", {})
            message = await connector.client.get_message(
                channel=item.get("channel", ""),
                ts=item.get("ts", ""),
            )
            event_data = {**message, "channel": item.get("channel", ""), "user": event.get("user", "")}

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
            # Optional: post confirmation to Slack thread
            await connector.client.post_thread_message(
                channel=channel,
                thread_ts=ts,
                text=f"Vigilにバグチケットを作成しました: {bug.title}",
            )
            results.append("created")
        except Exception as e:
            await integration_repo.log_event(
                str(integration.id), "error", source_ref=source_ref, error_message=str(e)
            )
            results.append("error")

    return {"ok": True, "results": results}


@router.post("/hubspot")
async def hubspot_webhook(
    request: Request,
    bug_usecase: BugUsecase = Depends(_get_bug_usecase),
    integration_repo: IntegrationRepository = Depends(_get_integration_repo),
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

        ticket_id = str(json_body.get("objectId", ""))
        if ticket_id and await integration_repo.is_duplicate(str(integration.id), ticket_id):
            await integration_repo.log_event(str(integration.id), "duplicate", source_ref=ticket_id)
            results.append("duplicate")
            continue

        try:
            bug_create = await connector.transform(json_body, integration.field_mappings or [])
            bug = await bug_usecase.create_bug(bug_create)
            await integration_repo.log_event(
                str(integration.id), "created", source_ref=ticket_id, bug_id=str(bug.id)
            )
            results.append("created")
        except Exception as e:
            await integration_repo.log_event(
                str(integration.id), "error", source_ref=ticket_id, error_message=str(e)
            )
            results.append("error")

    return {"ok": True, "results": results}
