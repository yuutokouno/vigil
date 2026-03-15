from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.infrastructure.connectors.hubspot.handler import HubSpotConnector
from app.infrastructure.connectors.hubspot.polling import poll_hubspot_integrations
from app.infrastructure.connectors.notion.handler import NotionConnector
from app.infrastructure.connectors.notion.polling import poll_notion_integrations
from app.infrastructure.connectors.registry import register_connector
from app.infrastructure.connectors.slack.handler import SlackConnector
from app.presentation.analytics import router as analytics_router
from app.presentation.attachments import router as attachments_router
from app.presentation.auth import router as auth_router
from app.presentation.bug_bash import router as bug_bash_router
from app.presentation.bugs import router as bugs_router
from app.presentation.integrations import router as integrations_router
from app.presentation.milestones import router as milestones_router
from app.presentation.projects import router as projects_router
from app.presentation.public import router as public_router
from app.presentation.test_scenarios import router as test_scenarios_router
from app.presentation.users import router as users_router
from app.presentation.webhooks import router as webhooks_router
from app.presentation.stop_the_line import router as stop_the_line_router
from app.presentation.workflow_columns import router as workflow_columns_router
from app.scheduler.stop_the_line import check_stop_the_line
from app.scheduler.test_reminder import send_test_checklist_reminders

app = FastAPI(title="Vigil", description="Bug tracking dashboard for archaive")

scheduler = AsyncIOScheduler()

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    https_only=False,  # Set True in production (HTTPS only)
    same_site="lax",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


app.include_router(analytics_router)
app.include_router(attachments_router)
app.include_router(auth_router)
app.include_router(bug_bash_router)
app.include_router(bugs_router)
app.include_router(integrations_router)
app.include_router(milestones_router)
app.include_router(projects_router)
app.include_router(public_router)
app.include_router(test_scenarios_router)
app.include_router(users_router)
app.include_router(webhooks_router)
app.include_router(stop_the_line_router)
app.include_router(workflow_columns_router)


@app.on_event("startup")
async def startup() -> None:
    # Register connector sentinels (actual credentials come from DB at request time)
    register_connector("slack", SlackConnector.__new__(SlackConnector))
    register_connector("hubspot", HubSpotConnector())
    register_connector("notion", NotionConnector())
    scheduler.add_job(poll_notion_integrations, "interval", minutes=5, id="notion_poll")
    scheduler.add_job(poll_hubspot_integrations, "interval", minutes=5, id="hubspot_poll")
    # Daily at 10:00 UTC: send Slack reminders for test checklist progress (#18)
    scheduler.add_job(
        send_test_checklist_reminders, "cron", hour=10, minute=0, id="test_reminder"
    )
    # Every 30 minutes: check stop-the-line thresholds and notify Slack if exceeded
    scheduler.add_job(check_stop_the_line, "interval", minutes=30, id="stop_the_line_check")
    scheduler.start()


@app.on_event("shutdown")
async def shutdown() -> None:
    scheduler.shutdown()


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
