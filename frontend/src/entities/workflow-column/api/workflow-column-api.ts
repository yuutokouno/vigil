import { apiClient } from "@/src/shared/api/client";
import type {
  WorkflowColumn,
  WorkflowColumnCreate,
  WorkflowColumnUpdate,
} from "@/src/entities/workflow-column/model/types";

export async function listWorkflowColumns(): Promise<WorkflowColumn[]> {
  return apiClient<WorkflowColumn[]>("/api/workflow-columns");
}

export async function createWorkflowColumn(
  data: WorkflowColumnCreate
): Promise<WorkflowColumn> {
  return apiClient<WorkflowColumn>("/api/workflow-columns", {
    method: "POST",
    body: data,
  });
}

export async function updateWorkflowColumn(
  id: string,
  data: WorkflowColumnUpdate
): Promise<WorkflowColumn> {
  return apiClient<WorkflowColumn>(`/api/workflow-columns/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteWorkflowColumn(id: string): Promise<void> {
  return apiClient<void>(`/api/workflow-columns/${id}`, { method: "DELETE" });
}
