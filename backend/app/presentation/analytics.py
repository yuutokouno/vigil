from datetime import datetime, timedelta, date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, cast, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.models import Bug, Milestone

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _period_days(period: str) -> int:
    return {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)


async def _compute_stats(session: AsyncSession, start: datetime, end: datetime) -> dict:
    # Daily created/closed
    daily_map: dict[date, dict] = {}
    delta = end.date() - start.date()
    for i in range(delta.days + 1):
        d = (start + timedelta(days=i)).date()
        daily_map[d] = {"date": d.isoformat(), "created": 0, "closed": 0}

    created_rows = await session.execute(
        select(func.date(Bug.created_at).label("d"), func.count().label("c"))
        .where(Bug.created_at >= start, Bug.created_at <= end)
        .group_by(func.date(Bug.created_at))
    )
    for row in created_rows:
        if row.d in daily_map:
            daily_map[row.d]["created"] = row.c

    closed_rows = await session.execute(
        select(func.date(Bug.closed_at).label("d"), func.count().label("c"))
        .where(Bug.closed_at >= start, Bug.closed_at <= end)
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
        ).where(Bug.closed_at >= start, Bug.closed_at <= end, Bug.closed_at.isnot(None))
    )
    avg_close_hours = round(float(avg_result.scalar() or 0), 1)

    # Severity breakdown (bugs created in period)
    sev_rows = await session.execute(
        select(Bug.severity, func.count().label("c"))
        .where(Bug.created_at >= start, Bug.created_at <= end)
        .group_by(Bug.severity)
    )
    by_severity = {row.severity: row.c for row in sev_rows}

    # Assignee breakdown (bugs closed in period)
    assignee_rows = await session.execute(
        select(Bug.assigned_to, func.count().label("c"))
        .where(
            Bug.closed_at >= start,
            Bug.closed_at <= end,
            Bug.assigned_to.isnot(None),
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


@router.get("")
async def get_analytics(
    period: Literal["7d", "30d", "90d"] = Query("30d"),
    compare_to: Literal["prev"] | None = Query(None),
    session: AsyncSession = Depends(get_session),
) -> dict:
    days = _period_days(period)
    now = datetime.utcnow()
    current_start = now - timedelta(days=days)

    current = await _compute_stats(session, current_start, now)

    previous = None
    if compare_to == "prev":
        prev_end = current_start
        prev_start = prev_end - timedelta(days=days)
        previous = await _compute_stats(session, prev_start, prev_end)

    # Active milestones with bug counts
    milestone_rows = await session.execute(
        select(
            Milestone.id,
            Milestone.title,
            func.count(Bug.id).label("total"),
            func.sum(
                cast(Bug.status == "closed", Integer)
            ).label("closed_count"),
        )
        .outerjoin(Bug, Bug.milestone_id == Milestone.id)
        .where(Milestone.status == "active")
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
