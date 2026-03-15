import uuid
from datetime import datetime, timedelta, date, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import Date, cast, func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.di.auth import ProjectAuthContext, verify_project_membership
from app.infrastructure.db.database import get_session
from app.domain.models import Bug, Milestone

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class DailyPoint(BaseModel):
    date: str
    created: int
    closed: int


class AssigneeStats(BaseModel):
    name: str
    closed: int


class PeriodStats(BaseModel):
    daily: list[DailyPoint]
    avg_close_hours: float
    by_severity: dict[str, int]
    by_assignee: list[AssigneeStats]


class MilestoneStat(BaseModel):
    id: str
    title: str
    total: int
    closed: int
    rate: int


class AnalyticsResponse(BaseModel):
    period: Literal["7d", "30d", "90d"]
    current: PeriodStats
    previous: PeriodStats | None = None
    milestones: list[MilestoneStat]


class HeatmapCell(BaseModel):
    week: str
    category: str
    count: int


class HeatmapResponse(BaseModel):
    weeks: list[str]
    categories: list[str]
    cells: list[HeatmapCell]


class DiscoveryStageCount(BaseModel):
    stage: str
    count: int


class DiscoveryStagesResponse(BaseModel):
    period: str
    stages: list[DiscoveryStageCount]


def _period_days(period: Literal["7d", "30d", "90d"]) -> int:
    return {"7d": 7, "30d": 30, "90d": 90}[period]


async def _compute_stats(
    session: AsyncSession,
    start: datetime,
    end: datetime,
    project_id: str,
    version: str | None = None,
    discovery_stage: str | None = None,
) -> dict:
    pid = uuid.UUID(project_id)

    def extra() -> list:
        """Return optional filter clauses for version/discovery_stage."""
        clauses = []
        if version:
            clauses.append(Bug.version == version)
        if discovery_stage:
            clauses.append(Bug.discovery_stage == discovery_stage)
        return clauses

    # Daily created/closed
    daily_map: dict[date, dict] = {}
    delta = end.date() - start.date()
    for i in range(delta.days + 1):
        d = (start + timedelta(days=i)).date()
        daily_map[d] = {"date": d.isoformat(), "created": 0, "closed": 0}

    created_rows = await session.execute(
        select(cast(func.date(Bug.created_at), Date).label("d"), func.count().label("c"))
        .where(
            Bug.project_id == pid,
            Bug.created_at >= start,
            Bug.created_at <= end,
            *extra(),
        )
        .group_by(func.date(Bug.created_at))
    )
    for row in created_rows:
        if row.d in daily_map:
            daily_map[row.d]["created"] = row.c

    closed_rows = await session.execute(
        select(cast(func.date(Bug.closed_at), Date).label("d"), func.count().label("c"))
        .where(
            Bug.project_id == pid,
            Bug.closed_at >= start,
            Bug.closed_at <= end,
            *extra(),
        )
        .group_by(func.date(Bug.closed_at))
    )
    for row in closed_rows:
        if row.d in daily_map:
            daily_map[row.d]["closed"] = row.c

    # Average close time (hours) for bugs closed in this period
    avg_result = await session.execute(
        select(
            func.avg(
                func.extract("epoch", Bug.closed_at - Bug.created_at) / 3600
            )
        ).where(
            Bug.project_id == pid,
            Bug.closed_at >= start,
            Bug.closed_at <= end,
            Bug.closed_at > Bug.created_at,
            *extra(),
        )
    )
    avg_close_hours = round(float(avg_result.scalar() or 0), 1)

    # Severity breakdown (bugs created in period)
    sev_rows = await session.execute(
        select(Bug.severity, func.count().label("c"))
        .where(
            Bug.project_id == pid,
            Bug.created_at >= start,
            Bug.created_at <= end,
            *extra(),
        )
        .group_by(Bug.severity)
    )
    by_severity = {row.severity: row.c for row in sev_rows}

    # Assignee breakdown (bugs closed in period)
    assignee_rows = await session.execute(
        select(Bug.assigned_to, func.count().label("c"))
        .where(
            Bug.project_id == pid,
            Bug.closed_at >= start,
            Bug.closed_at <= end,
            Bug.assigned_to.isnot(None),
            *extra(),
        )
        .group_by(Bug.assigned_to)
        .order_by(func.count().desc())
        .limit(10)
    )
    by_assignee = [
        {"name": row.assigned_to, "closed": row.c} for row in assignee_rows
    ]

    return {
        "daily": list(daily_map.values()),
        "avg_close_hours": avg_close_hours,
        "by_severity": by_severity,
        "by_assignee": by_assignee,
    }


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    period: Literal["7d", "30d", "90d"] = Query("30d"),
    compare_to: Literal["prev"] | None = Query(None),
    version: str | None = Query(None),
    discovery_stage: str | None = Query(None),
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> AnalyticsResponse:
    pid = _auth.project_id
    days = _period_days(period)
    now = datetime.now(timezone.utc)
    current_start = now - timedelta(days=days)

    current = await _compute_stats(
        session, current_start, now, pid, version, discovery_stage
    )

    previous = None
    if compare_to == "prev":
        prev_end = current_start
        prev_start = prev_end - timedelta(days=days)
        previous = await _compute_stats(
            session, prev_start, prev_end, pid, version, discovery_stage
        )

    # Active milestones with bug counts, scoped to project
    pid_uuid = uuid.UUID(pid)
    milestone_rows = await session.execute(
        select(
            Milestone.id,
            Milestone.title,
            func.count(Bug.id).label("total"),
            func.count().filter(Bug.status == "closed").label("closed_count"),
        )
        .outerjoin(Bug, Bug.milestone_id == Milestone.id)
        .where(Milestone.project_id == pid_uuid, Milestone.status == "active")
        .group_by(Milestone.id, Milestone.title)
    )

    milestones = []
    for row in milestone_rows:
        total = row.total or 0
        closed = int(row.closed_count or 0)
        milestones.append({
            "id": str(row.id),
            "title": row.title,
            "total": total,
            "closed": closed,
            "rate": round(closed / total * 100) if total > 0 else 0,
        })

    return {
        "period": period,
        "current": current,
        "previous": previous,
        "milestones": milestones,
    }


@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap(
    period: Literal["7d", "30d", "90d"] = Query("30d"),
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> HeatmapResponse:
    """Return weekly x category bug count matrix for heatmap visualization."""
    pid = uuid.UUID(_auth.project_id)
    days = _period_days(period)
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)

    # Use literal_column for the format string so PostgreSQL receives the same
    # inline literal in SELECT, GROUP BY, and ORDER BY — avoiding the
    # "must appear in GROUP BY" error caused by separate bind parameters.
    iso_week_fmt = literal_column("'IYYY-\"W\"IW'")
    week_expr = func.to_char(Bug.created_at, iso_week_fmt)

    rows = await session.execute(
        select(
            week_expr.label("week"),
            Bug.category,
            func.count().label("cnt"),
        )
        .where(
            Bug.project_id == pid,
            Bug.created_at >= start,
            Bug.created_at <= now,
        )
        .group_by(week_expr, Bug.category)
        .order_by(week_expr)
    )

    cells: list[HeatmapCell] = []
    weeks_set: set[str] = set()
    categories_set: set[str] = set()

    for row in rows:
        week = row.week
        category = row.category or "uncategorized"
        weeks_set.add(week)
        categories_set.add(category)
        cells.append(HeatmapCell(week=week, category=category, count=row.cnt))

    return HeatmapResponse(
        weeks=sorted(weeks_set),
        categories=sorted(categories_set),
        cells=cells,
    )


@router.get("/discovery-stages", response_model=DiscoveryStagesResponse)
async def get_discovery_stages(
    period: Literal["7d", "30d", "90d"] = Query("30d"),
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    session: AsyncSession = Depends(get_session),
) -> DiscoveryStagesResponse:
    """Return bug counts grouped by discovery_stage for the given period."""
    pid = uuid.UUID(_auth.project_id)
    days = _period_days(period)
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)

    rows = await session.execute(
        select(Bug.discovery_stage, func.count().label("cnt"))
        .where(
            Bug.project_id == pid,
            Bug.created_at >= start,
            Bug.created_at <= now,
        )
        .group_by(Bug.discovery_stage)
        .order_by(func.count().desc())
    )

    stages = [
        DiscoveryStageCount(stage=row.discovery_stage or "unknown", count=row.cnt)
        for row in rows
    ]
    return DiscoveryStagesResponse(period=period, stages=stages)
