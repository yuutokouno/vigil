# backend/app/presentation/webhooks.py
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.github.client import GitHubClient
from app.connectors.github.handler import (
    parse_issue_event,
    parse_pr_event,
    verify_signature,
)
from app.di.bug import get_bug_usecase
from app.di.integration import get_integration_repo
from app.domain.models import Integration, Project
from app.domain.schemas import BugCreate, BugUpdate, Source
from app.infrastructure.connectors.encryption import CredentialDecryptionError, decrypt_credentials
from app.infrastructure.connectors.registry import get_connector
from app.infrastructure.connectors.slack.handler import SlackConnector
from app.infrastructure.db.database import get_session
from app.infrastructure.repository.integration_repo import IntegrationRepository
from app.usecase.bug_usecase import BugUsecase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


async def _resolve_project_id(integration: Integration, session: AsyncSession) -> str | None:
    """Return project_id for an integration, falling back to the default project."""
    if integration.project_id is not None:
        return str(integration.project_id)
    result = await session.execute(
        select(Project).where(Project.slug == "default").limit(1)
    )
    project = result.scalars().first()
    return str(project.id) if project else None


@router.post("/slack")
async def slack_webhook(
    request: Request,
    bug_usecase: BugUsecase = Depends(get_bug_usecase),
    integration_repo: IntegrationRepository = Depends(get_integration_repo),
    session: AsyncSession = Depends(get_session),
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

        # Resolve project
        project_id = await _resolve_project_id(integration, session)
        if project_id is None:
            await integration_repo.log_event(
                str(integration.id), "error", error_message="no_project_configured"
            )
            results.append("error")
            continue

        # Transform and create bug
        try:
            bug_create = await connector.transform(event_data, integration.field_mappings or [])
            bug = await bug_usecase.create_bug(bug_create, project_id)
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
    session: AsyncSession = Depends(get_session),
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

        # Resolve project
        project_id = await _resolve_project_id(integration, session)
        if project_id is None:
            await integration_repo.log_event(
                str(integration.id), "error", error_message="no_project_configured"
            )
            results.append("error")
            continue

        try:
            bug_create = await connector.transform(json_body, integration.field_mappings or [])
            bug = await bug_usecase.create_bug(bug_create, project_id)
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


@router.post("/github")
async def github_webhook(
    request: Request,
    bug_usecase: BugUsecase = Depends(get_bug_usecase),
    integration_repo: IntegrationRepository = Depends(get_integration_repo),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """GitHub webhook handler.

    Handles:
    - pull_request (opened/synchronize): link PR URL to bug, set status → in_review
    - pull_request (closed + merged): link PR URL to bug, set status → closed
    - issues (opened): create Vigil bug from GitHub Issue
    - issues (labeled with 'scenario-test'): stub for #14 (requires test_scenarios table)
    """
    body = await request.body()
    json_body = await request.json()
    event_type = request.headers.get("X-GitHub-Event", "")
    sig_header = request.headers.get("X-Hub-Signature-256")

    if not event_type:
        return {"ok": False, "error": "missing_event_header"}

    integrations = await integration_repo.list_active_by_source("github")
    if not integrations:
        return {"ok": True, "action": "no_active_integration"}

    # Find the integration whose webhook secret matches the signature.
    # Each integration corresponds to one GitHub repo/org → Vigil project mapping.
    matched_integration = None
    matched_credentials: dict = {}
    for integration in integrations:
        try:
            creds = decrypt_credentials(integration.credentials_enc)
        except CredentialDecryptionError:
            continue
        secret = creds.get("webhook_secret", "")
        if not secret:
            # If no secret is configured, treat as matched (dev/testing mode).
            matched_integration = integration
            matched_credentials = creds
            break
        if verify_signature(body, sig_header, secret):
            matched_integration = integration
            matched_credentials = creds
            break

    if matched_integration is None:
        return {"ok": False, "error": "signature_verification_failed"}

    project_id = await _resolve_project_id(matched_integration, session)
    if project_id is None:
        return {"ok": False, "error": "no_project_configured"}

    if event_type == "pull_request":
        return await _handle_pr_event(
            json_body, project_id, bug_usecase, matched_credentials.get("access_token", ""),
            str(matched_integration.id), integration_repo,
        )
    elif event_type == "issues":
        return await _handle_issues_event(
            json_body, project_id, bug_usecase,
            matched_credentials.get("access_token", ""),
            str(matched_integration.id), integration_repo,
        )
    else:
        return {"ok": True, "action": "ignored", "event": event_type}


async def _handle_pr_event(
    payload: dict,
    project_id: str,
    bug_usecase: BugUsecase,
    access_token: str,
    integration_id: str,
    integration_repo: IntegrationRepository,
) -> dict:
    """Link PR to Vigil bugs and transition their status."""
    parsed = parse_pr_event(payload)
    if parsed is None:
        return {"ok": True, "action": "ignored"}

    results = []
    for bug_number in parsed["bug_numbers"]:
        bug = await bug_usecase.get_bug_by_number(bug_number, project_id)
        if bug is None:
            logger.info("GitHub PR: VIGIL-%s not found in project %s", bug_number, project_id)
            results.append(f"VIGIL-{bug_number}:not_found")
            continue

        new_status: str | None = None
        if parsed["merged"]:
            new_status = "closed"
        elif parsed["action"] in ("opened", "synchronize"):
            new_status = "in_review"

        update = BugUpdate(
            github_pr_url=parsed["pr_url"],
            status=new_status,
        )
        if parsed["merged"]:
            update = BugUpdate.model_validate(
                {**update.model_dump(exclude_unset=True), "closed_at": datetime.now(timezone.utc)}
            )

        try:
            await bug_usecase.update_bug(bug.id, update, project_id)
            results.append(f"VIGIL-{bug_number}:updated")
        except Exception:
            logger.exception("GitHub PR: failed to update VIGIL-%s", bug_number)
            results.append(f"VIGIL-{bug_number}:error")

    await integration_repo.log_event(
        integration_id, "processed",
        source_ref=f"pr:{payload.get('pull_request', {}).get('number', '')}",
    )
    return {"ok": True, "action": "pr_processed", "results": results}


async def _handle_issues_event(
    payload: dict,
    project_id: str,
    bug_usecase: BugUsecase,
    access_token: str,
    integration_id: str,
    integration_repo: IntegrationRepository,
) -> dict:
    """Create a Vigil bug from a GitHub Issue (inbound) or handle label events."""
    parsed = parse_issue_event(payload)
    if parsed is None:
        return {"ok": True, "action": "ignored"}

    issue_number = parsed["issue_number"]
    source_ref = f"github:issue:{issue_number}"

    if parsed["action"] == "labeled":
        if "scenario-test" in parsed["labels"]:
            # Stub for #14: full implementation requires test_scenarios table (see #15).
            logger.info(
                "GitHub Issue #%s labeled 'scenario-test' — scenario sync pending (#14/#15)",
                issue_number,
            )
        return {"ok": True, "action": "label_noted"}

    # action == "opened": create Vigil bug
    if await integration_repo.is_duplicate(integration_id, source_ref):
        return {"ok": True, "action": "duplicate"}

    bug_create = BugCreate(
        title=parsed["title"],
        description=parsed["body"],
        source=Source.GITHUB,
        external_ref=source_ref,
    )
    # github_issue_url is not in BugCreate schema; set it via update after creation
    try:
        bug = await bug_usecase.create_bug(bug_create, project_id)
        # Link the GitHub Issue URL on the just-created bug
        await bug_usecase.update_bug(
            bug.id,
            BugUpdate(github_issue_url=parsed["issue_url"]),
            project_id,
        )
        await integration_repo.log_event(
            integration_id, "created", source_ref=source_ref, bug_id=str(bug.id)
        )
    except Exception as e:
        logger.exception("GitHub Issues webhook: bug creation failed for issue #%s", issue_number)
        await integration_repo.log_event(
            integration_id, "error", source_ref=source_ref, error_message=str(e)
        )
        return {"ok": False, "error": str(e)}

    # Outbound: add "vigil-tracked" label to the GitHub issue (best-effort)
    if access_token and parsed["issue_url"]:
        try:
            gh = GitHubClient(access_token)
            await gh.add_label(parsed["issue_url"], "vigil-tracked")
        except Exception:
            pass  # Non-fatal

    return {"ok": True, "action": "bug_created", "bug_id": bug.id}
