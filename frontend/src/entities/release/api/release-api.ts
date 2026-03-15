import { apiClient } from "@/src/shared/api/client";
import type {
  ChecklistItem,
  GenerateChecklistResponse,
  Release,
  ReleaseCreate,
  ReleaseUpdate,
} from "@/src/entities/release/model/types";

export async function listReleases(): Promise<Release[]> {
  return apiClient<Release[]>("/api/releases");
}

export async function createRelease(data: ReleaseCreate): Promise<Release> {
  return apiClient<Release>("/api/releases", { method: "POST", body: data });
}

export async function updateRelease(
  id: string,
  data: ReleaseUpdate
): Promise<Release> {
  return apiClient<Release>(`/api/releases/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function generateChecklist(
  releaseId: string,
  topN = 10
): Promise<GenerateChecklistResponse> {
  return apiClient<GenerateChecklistResponse>(
    `/api/releases/${releaseId}/generate-checklist`,
    { method: "POST", params: { top_n: topN } }
  );
}

export async function getChecklist(releaseId: string): Promise<ChecklistItem[]> {
  return apiClient<ChecklistItem[]>(`/api/releases/${releaseId}/checklist`);
}

export async function updateChecklistItem(
  releaseId: string,
  itemId: string,
  isChecked: boolean,
  checkedBy?: string
): Promise<ChecklistItem> {
  return apiClient<ChecklistItem>(
    `/api/releases/${releaseId}/checklist/${itemId}`,
    {
      method: "PATCH",
      body: { is_checked: isChecked, checked_by: checkedBy ?? null },
    }
  );
}
