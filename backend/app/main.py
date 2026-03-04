from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.presentation.analytics import router as analytics_router
from app.presentation.auth import router as auth_router
from app.presentation.bugs import router as bugs_router
from app.presentation.integrations import router as integrations_router
from app.presentation.milestones import router as milestones_router
from app.presentation.users import router as users_router
from app.presentation.workflow_columns import router as workflow_columns_router

app = FastAPI(title="Vigil", description="Bug tracking dashboard for archaive")

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
app.include_router(workflow_columns_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
