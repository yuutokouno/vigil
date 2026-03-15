"""Stop the Line API endpoint.

Returns the current stop-the-line status for the authenticated project:
whether the quality gate is triggered and the current critical/high bug counts
vs. their configured thresholds.

Thresholds are stored in the Slack integration's trigger_rules JSONB field
under the keys `stop_the_line_critical` (default: 3) and
`stop_the_line_high` (default: 10).
"""
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.di.auth import ProjectAuthContext, verify_project_membership
from app.domain.models import Bug, Integration
from app.infrastructure.db.database import get_session

router = APIRouter(prefix="/api/stop-the-line", tags=["stop-the-line"])

_DEFAULT_THRESHOLD_CRITICAL = 3
_DEFAULT_THRESHOLD_HIGH = 10


class StopTheLineStatus(BaseModel):
    is_triggered: bool
    critical_count: int
    high_count: int
    threshold_critical: int
    threshold_high: int


@router.get("/status", response_model=StopTheLineStatus)
async def get_status(
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> StopTheLineStatus:
    """Return the current stop-the-line status for the project."""
    pid = uuid.UUID(_auth.project_id)

    # Load thresholds from the project's active Slack integration trigger_rules.
    # Falls back to defaults if no Slack integration is configured.
    slack_integration = await session.scalar(
        select(Integration)
        .where(
            Integration.project_id == pid,
            Integration.source_type == "slack",
            Integration.is_active.is_(True),
        )
        .limit(1)
    )
    rules = (slack_integration.trigger_rules or {}) if slack_integration else {}
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

    return StopTheLineStatus(
        is_triggered=is_triggered,
        critical_count=critical_count,
        high_count=high_count,
        threshold_critical=threshold_critical,
        threshold_high=threshold_high,
    )
