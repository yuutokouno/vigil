import { apiClient } from "@/src/shared/api/client";
import type {
  TestScenario,
  TestScenarioCreate,
  TestScenarioPriority,
  TestScenarioUpdate,
} from "@/src/entities/test-scenario/model/types";

export async function listScenarios(): Promise<TestScenario[]> {
  return apiClient<TestScenario[]>("/api/test-scenarios");
}

export async function createScenario(
  data: TestScenarioCreate
): Promise<TestScenario> {
  return apiClient<TestScenario>("/api/test-scenarios", {
    method: "POST",
    body: data,
  });
}

export async function updateScenario(
  id: string,
  data: TestScenarioUpdate
): Promise<TestScenario> {
  return apiClient<TestScenario>(`/api/test-scenarios/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteScenario(id: string): Promise<void> {
  return apiClient<void>(`/api/test-scenarios/${id}`, { method: "DELETE" });
}

export async function getScenarioPriorities(
  days = 30
): Promise<TestScenarioPriority[]> {
  return apiClient<TestScenarioPriority[]>("/api/test-scenarios/priorities", {
    params: { days },
  });
}
