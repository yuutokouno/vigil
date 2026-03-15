"""Bug Bash feature: time-boxed bug hunting events with a leaderboard."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.di.auth import ProjectAuthContext, verify_project_membership
from app.domain.models import Bug, BugBashEvent, BugBashParticipation, BugBashSubmission, User
from app.infrastructure.db.database import get_session

router = APIRouter(prefix="/api/bug-bash", tags=["bug-bash"])

# Severity score weights used to calculate the leaderboard
_SEVERITY_SCORE: dict[str, int] = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}


# --- Schemas ---

class EventCreate(BaseModel):
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime


class EventResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str | None
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime


class ParticipantScore(BaseModel):
    user_id: str
    name: str
    avatar_url: str | None
    bug_count: int
    score: float


class LeaderboardResponse(BaseModel):
    event: EventResponse
    participants: list[ParticipantScore]


class SubmitBugRequest(BaseModel):
    bug_id: str


# --- Endpoints ---

@router.get("", response_model=list[EventResponse])
async def list_events(
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> list[EventResponse]:
    pid = uuid.UUID(_auth.project_id)
    rows = (
        await session.execute(
            select(BugBashEvent)
            .where(BugBashEvent.project_id == pid)
            .order_by(BugBashEvent.start_time.desc())
        )
    ).scalars().all()
    return [_event_to_response(e) for e in rows]


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    body: EventCreate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> EventResponse:
    pid = uuid.UUID(_auth.project_id)
    now = datetime.now(timezone.utc)

    # Determine initial status based on the provided time window
    if body.start_time <= now <= body.end_time:
        status = "active"
    elif now > body.end_time:
        status = "completed"
    else:
        status = "scheduled"

    event = BugBashEvent(
        project_id=pid,
        title=body.title,
        description=body.description,
        start_time=body.start_time,
        end_time=body.end_time,
        status=status,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return _event_to_response(event)


@router.get("/{event_id}/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    event_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> LeaderboardResponse:
    pid = uuid.UUID(_auth.project_id)
    eid = uuid.UUID(event_id)

    event = await session.get(BugBashEvent, eid)
    if not event or event.project_id != pid:
        raise HTTPException(status_code=404, detail="Event not found")

    # Fetch all submissions with joined bug and user data
    rows = (
        await session.execute(
            select(BugBashSubmission, Bug, User)
            .join(Bug, Bug.id == BugBashSubmission.bug_id)
            .join(User, User.id == BugBashSubmission.user_id)
            .where(BugBashSubmission.event_id == eid)
        )
    ).all()

    # Aggregate per-user scores
    scores: dict[str, dict] = {}
    for submission, bug, user in rows:
        uid = str(user.id)
        if uid not in scores:
            scores[uid] = {
                "user_id": uid,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "bug_count": 0,
                "score": 0.0,
            }
        scores[uid]["bug_count"] += 1
        scores[uid]["score"] += _SEVERITY_SCORE.get(bug.severity or "low", 1)

    participants = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    return LeaderboardResponse(
        event=_event_to_response(event),
        participants=[ParticipantScore(**p) for p in participants],
    )


@router.post("/{event_id}/join", status_code=204)
async def join_event(
    event_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> None:
    eid = uuid.UUID(event_id)
    uid = uuid.UUID(_auth.user_id)

    existing = await session.scalar(
        select(BugBashParticipation).where(
            BugBashParticipation.event_id == eid,
            BugBashParticipation.user_id == uid,
        )
    )
    if not existing:
        session.add(BugBashParticipation(event_id=eid, user_id=uid))
        await session.commit()


@router.post("/{event_id}/submit", status_code=201)
async def submit_bug(
    event_id: str,
    body: SubmitBugRequest,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> dict[str, bool]:
    eid = uuid.UUID(event_id)
    uid = uuid.UUID(_auth.user_id)
    bug_id = uuid.UUID(body.bug_id)

    existing = await session.scalar(
        select(BugBashSubmission).where(
            BugBashSubmission.event_id == eid,
            BugBashSubmission.bug_id == bug_id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Bug already submitted to this event")

    session.add(BugBashSubmission(event_id=eid, bug_id=bug_id, user_id=uid))
    await session.commit()
    return {"ok": True}


# --- Helpers ---

def _event_to_response(e: BugBashEvent) -> EventResponse:
    return EventResponse(
        id=str(e.id),
        project_id=str(e.project_id),
        title=e.title,
        description=e.description,
        start_time=e.start_time,
        end_time=e.end_time,
        status=e.status,
        created_at=e.created_at,
    )
