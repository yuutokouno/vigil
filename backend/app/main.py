from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infrastructure.connectors.hubspot.handler import HubSpotConnector
from app.infrastructure.connectors.notion.handler import NotionConnector
from app.infrastructure.connectors.notion.polling import poll_notion_integrations
from app.infrastructure.connectors.registry import register_connector
from app.infrastructure.connectors.slack.handler import SlackConnector
from app.presentation.analytics import router as analytics_router
from app.presentation.auth import router as auth_router
from app.presentation.bugs import router as bugs_router
from app.presentation.integrations import router as integrations_router
from app.presentation.milestones import router as milestones_router
from app.presentation.users import router as users_router
from app.presentation.webhooks import router as webhooks_router
from app.presentation.workflow_columns import router as workflow_columns_router

app = FastAPI(title="Vigil", description="Bug tracking dashboard for archaive")

scheduler = AsyncIOScheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(bugs_router)
app.include_router(integrations_router)
app.include_router(milestones_router)
app.include_router(users_router)
app.include_router(webhooks_router)
app.include_router(workflow_columns_router)


@app.on_event("startup")
async def startup() -> None:
    # Register connector sentinels (actual credentials come from DB at request time)
    register_connector("slack", SlackConnector.__new__(SlackConnector))
    register_connector("hubspot", HubSpotConnector())
    register_connector("notion", NotionConnector())
    scheduler.add_job(poll_notion_integrations, "interval", minutes=5, id="notion_poll")
    scheduler.start()


@app.on_event("shutdown")
async def shutdown() -> None:
    scheduler.shutdown()


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
