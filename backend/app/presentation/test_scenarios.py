"""API endpoints for test scenario management (#15, #16, #17)."""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.di.auth import ProjectAuthContext, verify_project_membership
from app.di.test_scenario import get_test_scenario_repo
from app.domain.schemas import (
    ChecklistItemResponse,
    ChecklistItemUpdate,
    GenerateChecklistResponse,
    ReleaseCreate,
    ReleaseResponse,
    ReleaseUpdate,
    TestScenarioCreate,
    TestScenarioPriorityResponse,
    TestScenarioResponse,
    TestScenarioUpdate,
)
from app.infrastructure.repository.test_scenario_repo import TestScenarioRepository

router = APIRouter(tags=["test-scenarios"])


# ---- Test Scenarios (#15) ----

@router.get("/api/test-scenarios", response_model=list[TestScenarioResponse])
async def list_scenarios(
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    return await repo.list_scenarios(_auth.project_id)


@router.post("/api/test-scenarios", response_model=TestScenarioResponse, status_code=201)
async def create_scenario(
    data: TestScenarioCreate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    return await repo.create_scenario(data, _auth.project_id)


@router.get("/api/test-scenarios/priorities", response_model=list[TestScenarioPriorityResponse])
async def get_priorities(
    days: int = Query(30, ge=1, le=365),
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    """Return scenarios sorted by risk score based on recent bug data (#16)."""
    return await repo.get_priorities(_auth.project_id, days=days)


@router.get("/api/test-scenarios/{scenario_id}", response_model=TestScenarioResponse)
async def get_scenario(
    scenario_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    result = await repo.get_scenario(scenario_id, _auth.project_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return result


@router.patch("/api/test-scenarios/{scenario_id}", response_model=TestScenarioResponse)
async def update_scenario(
    scenario_id: str,
    data: TestScenarioUpdate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    result = await repo.update_scenario(scenario_id, data, _auth.project_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return result


@router.delete("/api/test-scenarios/{scenario_id}", status_code=204)
async def delete_scenario(
    scenario_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    deleted = await repo.delete_scenario(scenario_id, _auth.project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scenario not found")


# ---- Releases (#17) ----

@router.get("/api/releases", response_model=list[ReleaseResponse])
async def list_releases(
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    return await repo.list_releases(_auth.project_id)


@router.post("/api/releases", response_model=ReleaseResponse, status_code=201)
async def create_release(
    data: ReleaseCreate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    return await repo.create_release(data, _auth.project_id)


@router.get("/api/releases/{release_id}", response_model=ReleaseResponse)
async def get_release(
    release_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    result = await repo.get_release(release_id, _auth.project_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Release not found")
    return result


@router.patch("/api/releases/{release_id}", response_model=ReleaseResponse)
async def update_release(
    release_id: str,
    data: ReleaseUpdate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    result = await repo.update_release(release_id, data, _auth.project_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Release not found")
    return result


# ---- Checklist (#17) ----

@router.post(
    "/api/releases/{release_id}/generate-checklist",
    response_model=GenerateChecklistResponse,
)
async def generate_checklist(
    release_id: str,
    top_n: int = Query(10, ge=1, le=50),
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    """Generate test checklist from top-N priority scenarios for this release."""
    result = await repo.generate_checklist(release_id, _auth.project_id, top_n=top_n)
    if result.generated == 0:
        raise HTTPException(status_code=404, detail="Release not found or no scenarios available")
    return result


@router.get(
    "/api/releases/{release_id}/checklist",
    response_model=list[ChecklistItemResponse],
)
async def get_checklist(
    release_id: str,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    return await repo.get_checklist(release_id, _auth.project_id)


@router.patch(
    "/api/releases/{release_id}/checklist/{item_id}",
    response_model=ChecklistItemResponse,
)
async def update_checklist_item(
    release_id: str,
    item_id: str,
    data: ChecklistItemUpdate,
    _auth: ProjectAuthContext = Depends(verify_project_membership),
    repo: TestScenarioRepository = Depends(get_test_scenario_repo),
):
    result = await repo.update_checklist_item(release_id, item_id, data, _auth.project_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    return result
