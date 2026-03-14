import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Bug
from app.domain.schemas import (
    BugCreate,
    BugListParams,
    BugListResponse,
    BugResponse,
    BugStatsResponse,
    BugUpdate,
)
from app.infrastructure.repository.base import BugRepository

SORTABLE_COLUMNS = {"created_at", "updated_at", "severity", "priority", "status"}


class PostgresBugRepository(BugRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, bug: BugCreate) -> BugResponse:
        db_bug = Bug(**bug.model_dump())
        self._session.add(db_bug)
        await self._session.commit()
        await self._session.refresh(db_bug)
        return self._to_response(db_bug)

    async def get_by_id(self, bug_id: str) -> BugResponse | None:
        bug = await self._session.get(Bug, uuid.UUID(bug_id))
        if bug is None:
            return None
        return self._to_response(bug)

    async def list_bugs(self, params: BugListParams) -> BugListResponse:
        query = select(Bug)
        count_query = select(func.count()).select_from(Bug)

        query, count_query = self._apply_filters(query, count_query, params)

        sort_column = self._resolve_sort_column(params.sort)
        if params.order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        offset = (params.page - 1) * params.limit
        query = query.offset(offset).limit(params.limit)

        result = await self._session.execute(query)
        bugs = result.scalars().all()

        total_result = await self._session.execute(count_query)
        total = total_result.scalar_one()

        return BugListResponse(
            items=[self._to_response(bug) for bug in bugs],
            total=total,
            page=params.page,
            limit=params.limit,
        )

    async def update(self, bug_id: str, bug: BugUpdate) -> BugResponse | None:
        db_bug = await self._session.get(Bug, uuid.UUID(bug_id))
        if db_bug is None:
            return None

        update_data = bug.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_bug, field, value)

        await self._session.commit()
        await self._session.refresh(db_bug)
        return self._to_response(db_bug)

    async def delete(self, bug_id: str) -> bool:
        db_bug = await self._session.get(Bug, uuid.UUID(bug_id))
        if db_bug is None:
            return False
        await self._session.delete(db_bug)
        await self._session.commit()
        return True

    async def get_stats(self) -> BugStatsResponse:
        total_result = await self._session.execute(
            select(func.count()).select_from(Bug)
        )
        total = total_result.scalar_one()

        by_status = await self._count_by_column(Bug.status)
        by_severity = await self._count_by_column(Bug.severity)
        by_category = await self._count_by_column(Bug.category)

        return BugStatsResponse(
            total=total,
            by_status=by_status,
            by_severity=by_severity,
            by_category=by_category,
        )

    async def _count_by_column(self, column) -> dict[str, int]:
        result = await self._session.execute(
            select(column, func.count()).group_by(column)
        )
        return {row[0] or "unknown": row[1] for row in result.all()}

    def _apply_filters(self, query, count_query, params: BugListParams):
        if params.status is not None:
            query = query.where(Bug.status == params.status.value)
            count_query = count_query.where(Bug.status == params.status.value)
        if params.severity is not None:
            query = query.where(Bug.severity == params.severity.value)
            count_query = count_query.where(Bug.severity == params.severity.value)
        if params.category is not None:
            query = query.where(Bug.category == params.category.value)
            count_query = count_query.where(Bug.category == params.category.value)
        if params.search:
            search_filter = Bug.title.ilike(f"%{params.search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        return query, count_query

    def _resolve_sort_column(self, sort: str):
        if sort not in SORTABLE_COLUMNS:
            return Bug.created_at
        return getattr(Bug, sort)

    @staticmethod
    def _to_response(bug: Bug) -> BugResponse:
        return BugResponse(
            id=str(bug.id),
            title=bug.title,
            description=bug.description,
            steps_to_reproduce=bug.steps_to_reproduce,
            expected_behavior=bug.expected_behavior,
            actual_behavior=bug.actual_behavior,
            environment=bug.environment,
            status=bug.status,
            severity=bug.severity,
            priority=bug.priority,
            category=bug.category,
            reported_by=bug.reported_by,
            assigned_to=bug.assigned_to,
            source=bug.source,
            sprint=bug.sprint,
            milestone_id=str(bug.milestone_id) if bug.milestone_id else None,
            slack_message_url=bug.slack_message_url,
            github_issue_url=bug.github_issue_url,
            external_ref=bug.external_ref,
            created_at=bug.created_at,
            updated_at=bug.updated_at,
            closed_at=bug.closed_at,
        )
