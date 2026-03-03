from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.presentation.bugs import router as bugs_router

app = FastAPI(title="Vigil", description="Bug tracking dashboard for archaive")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(bugs_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
