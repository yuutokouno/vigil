"""Repository for test scenarios, checklist items, and releases."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models import Bug, Release, TestChecklistItem, TestScenario
from app.domain.schemas import (
    ChecklistItemResponse,
    ChecklistItemUpdate,
    GenerateChecklistResponse,
    ReleaseCreate,
    ReleaseResponse,
    ReleaseStatus,
    ReleaseUpdate,
    TestScenarioCreate,
    TestScenarioPriorityResponse,
    TestScenarioResponse,
    TestScenarioUpdate,
)

_SEVERITY_WEIGHT = {"critical": 4.0, "high": 3.0, "medium": 2.0, "low": 1.0}
_DISCOVERY_WEIGHT = {"customer": 3.0, "aegis": 2.0, "qa": 1.5, "internal": 1.0}


class TestScenarioRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ---- TestScenario CRUD ----

    async def create_scenario(
        self, data: TestScenarioCreate, project_id: str
    ) -> TestScenarioResponse:
        scenario = TestScenario(
            **data.model_dump(),
            project_id=uuid.UUID(project_id),
        )
        self._session.add(scenario)
        await self._session.commit()
        await self._session.refresh(scenario)
        return self._to_scenario_response(scenario)

    async def list_scenarios(self, project_id: str) -> list[TestScenarioResponse]:
        result = await self._session.execute(
            select(TestScenario)
            .where(TestScenario.project_id == uuid.UUID(project_id))
            .order_by(TestScenario.created_at.desc())
        )
        return [self._to_scenario_response(s) for s in result.scalars().all()]

    async def get_scenario(self, scenario_id: str, project_id: str) -> TestScenarioResponse | None:
        scenario = await self._session.get(TestScenario, uuid.UUID(scenario_id))
        if scenario is None or str(scenario.project_id) != project_id:
            return None
        return self._to_scenario_response(scenario)

    async def update_scenario(
        self, scenario_id: str, data: TestScenarioUpdate, project_id: str
    ) -> TestScenarioResponse | None:
        scenario = await self._session.get(TestScenario, uuid.UUID(scenario_id))
        if scenario is None or str(scenario.project_id) != project_id:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(scenario, field, value)
        await self._session.commit()
        await self._session.refresh(scenario)
        return self._to_scenario_response(scenario)

    async def delete_scenario(self, scenario_id: str, project_id: str) -> bool:
        scenario = await self._session.get(TestScenario, uuid.UUID(scenario_id))
        if scenario is None or str(scenario.project_id) != project_id:
            return False
        await self._session.delete(scenario)
        await self._session.commit()
        return True

    # ---- Priority Scoring (#16) ----

    async def get_priorities(
        self, project_id: str, days: int = 30
    ) -> list[TestScenarioPriorityResponse]:
        """Score each scenario by bugs in the last `days` days matching its feature_tag."""
        pid = uuid.UUID(project_id)
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        scenarios_result = await self._session.execute(
            select(TestScenario).where(TestScenario.project_id == pid)
        )
        scenarios = scenarios_result.scalars().all()

        # Fetch all unclosed bugs in the window for this project
        bugs_result = await self._session.execute(
            select(Bug).where(
                Bug.project_id == pid,
                Bug.status != "closed",
                Bug.created_at >= cutoff,
            )
        )
        bugs = bugs_result.scalars().all()

        # Build a map: feature_tag → list of bugs (match by category)
        bugs_by_tag: dict[str, list[Bug]] = {}
        for bug in bugs:
            tag = (bug.category or "other").lower()
            bugs_by_tag.setdefault(tag, []).append(bug)

        scored: list[TestScenarioPriorityResponse] = []
        for scenario in scenarios:
            tag = scenario.feature_tag.lower()
            matching = bugs_by_tag.get(tag, [])
            score = sum(
                _SEVERITY_WEIGHT.get(b.severity, 1.0)
                * _DISCOVERY_WEIGHT.get(b.discovery_stage or "internal", 1.0)
                for b in matching
            )
            scored.append(
                TestScenarioPriorityResponse(
                    scenario=self._to_scenario_response(scenario),
                    score=score,
                    bug_count=len(matching),
                )
            )

        scored.sort(key=lambda x: x.score, reverse=True)
        return scored

    # ---- Releases CRUD ----

    async def create_release(self, data: ReleaseCreate, project_id: str) -> ReleaseResponse:
        release = Release(**data.model_dump(), project_id=uuid.UUID(project_id))
        self._session.add(release)
        await self._session.commit()
        await self._session.refresh(release)
        return self._to_release_response(release)

    async def list_releases(self, project_id: str) -> list[ReleaseResponse]:
        result = await self._session.execute(
            select(Release)
            .where(Release.project_id == uuid.UUID(project_id))
            .order_by(Release.created_at.desc())
        )
        return [self._to_release_response(r) for r in result.scalars().all()]

    async def get_release(self, release_id: str, project_id: str) -> ReleaseResponse | None:
        release = await self._session.get(Release, uuid.UUID(release_id))
        if release is None or str(release.project_id) != project_id:
            return None
        return self._to_release_response(release)

    async def update_release(
        self, release_id: str, data: ReleaseUpdate, project_id: str
    ) -> ReleaseResponse | None:
        release = await self._session.get(Release, uuid.UUID(release_id))
        if release is None or str(release.project_id) != project_id:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(release, field, value)
        await self._session.commit()
        await self._session.refresh(release)
        return self._to_release_response(release)

    # ---- Checklist (#17) ----

    async def generate_checklist(
        self, release_id: str, project_id: str, top_n: int = 10
    ) -> GenerateChecklistResponse:
        """Generate checklist items for the top-N priority scenarios."""
        release = await self._session.get(Release, uuid.UUID(release_id))
        if release is None or str(release.project_id) != project_id:
            return GenerateChecklistResponse(generated=0, items=[])

        # Get top-N scored scenarios
        priorities = await self.get_priorities(project_id)
        top_scenarios = priorities[:top_n]

        # Delete existing items for this release (regeneration)
        existing = await self._session.execute(
            select(TestChecklistItem).where(
                TestChecklistItem.release_id == uuid.UUID(release_id)
            )
        )
        for item in existing.scalars().all():
            await self._session.delete(item)

        # Create new items
        items = []
        for priority in top_scenarios:
            item = TestChecklistItem(
                scenario_id=uuid.UUID(priority.scenario.id),
                release_id=uuid.UUID(release_id),
            )
            self._session.add(item)
            items.append(item)

        await self._session.commit()
        for item in items:
            await self._session.refresh(item)

        responses = [await self._to_checklist_response(item) for item in items]
        return GenerateChecklistResponse(generated=len(responses), items=responses)

    async def get_checklist(
        self, release_id: str, project_id: str
    ) -> list[ChecklistItemResponse]:
        release = await self._session.get(Release, uuid.UUID(release_id))
        if release is None or str(release.project_id) != project_id:
            return []

        result = await self._session.execute(
            select(TestChecklistItem)
            .where(TestChecklistItem.release_id == uuid.UUID(release_id))
            .options(selectinload(TestChecklistItem.scenario))
            .order_by(TestChecklistItem.id)
        )
        items = result.scalars().all()
        return [await self._to_checklist_response(item) for item in items]

    async def update_checklist_item(
        self, release_id: str, item_id: str, data: ChecklistItemUpdate, project_id: str
    ) -> ChecklistItemResponse | None:
        # Verify release ownership
        release = await self._session.get(Release, uuid.UUID(release_id))
        if release is None or str(release.project_id) != project_id:
            return None

        item = await self._session.get(TestChecklistItem, uuid.UUID(item_id))
        if item is None or str(item.release_id) != release_id:
            return None

        item.is_checked = data.is_checked
        item.checked_by = data.checked_by
        item.checked_at = datetime.now(timezone.utc) if data.is_checked else None

        await self._session.commit()
        await self._session.refresh(item)
        return await self._to_checklist_response(item)

    # ---- Scheduler helpers (#18) ----

    async def get_active_releases(self) -> list[Release]:
        result = await self._session.execute(
            select(Release).where(Release.status == ReleaseStatus.ACTIVE)
        )
        return result.scalars().all()

    async def get_checklist_progress(self, release_id: uuid.UUID) -> tuple[int, int]:
        """Return (checked_count, total_count) for a release."""
        total_result = await self._session.execute(
            select(func.count()).select_from(TestChecklistItem).where(
                TestChecklistItem.release_id == release_id
            )
        )
        total = total_result.scalar_one()

        checked_result = await self._session.execute(
            select(func.count()).select_from(TestChecklistItem).where(
                TestChecklistItem.release_id == release_id,
                TestChecklistItem.is_checked.is_(True),
            )
        )
        checked = checked_result.scalar_one()
        return checked, total

    # ---- Private helpers ----

    @staticmethod
    def _to_scenario_response(s: TestScenario) -> TestScenarioResponse:
        return TestScenarioResponse(
            id=str(s.id),
            project_id=str(s.project_id) if s.project_id else None,
            title=s.title,
            description=s.description,
            feature_tag=s.feature_tag,
            steps_json=s.steps_json or [],
            created_at=s.created_at,
            updated_at=s.updated_at,
        )

    @staticmethod
    def _to_release_response(r: Release) -> ReleaseResponse:
        return ReleaseResponse(
            id=str(r.id),
            project_id=str(r.project_id) if r.project_id else None,
            version=r.version,
            release_date=r.release_date,
            status=r.status,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )

    async def _to_checklist_response(self, item: TestChecklistItem) -> ChecklistItemResponse:
        scenario = await self._session.get(TestScenario, item.scenario_id)
        return ChecklistItemResponse(
            id=str(item.id),
            scenario_id=str(item.scenario_id),
            release_id=str(item.release_id),
            is_checked=item.is_checked,
            checked_by=item.checked_by,
            checked_at=item.checked_at,
            scenario=self._to_scenario_response(scenario) if scenario else None,
        )
