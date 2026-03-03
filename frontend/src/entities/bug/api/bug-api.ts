import { apiClient } from "@/src/shared/api/client";
import type {
  Bug,
  BugCreate,
  BugListParams,
  BugListResponse,
  BugStats,
  BugUpdate,
} from "@/src/entities/bug/model/types";

export async function createBug(data: BugCreate): Promise<Bug> {
  return apiClient<Bug>("/api/bugs", { method: "POST", body: data });
}

export async function getBug(id: string): Promise<Bug> {
  return apiClient<Bug>(`/api/bugs/${id}`);
}

export async function listBugs(params: BugListParams = {}): Promise<BugListResponse> {
  return apiClient<BugListResponse>("/api/bugs", {
    params: params as Record<string, string | number | undefined>,
  });
}

export async function updateBug(id: string, data: BugUpdate): Promise<Bug> {
  return apiClient<Bug>(`/api/bugs/${id}`, { method: "PATCH", body: data });
}

export async function deleteBug(id: string): Promise<void> {
  return apiClient<void>(`/api/bugs/${id}`, { method: "DELETE" });
}

export async function getBugStats(): Promise<BugStats> {
  return apiClient<BugStats>("/api/bugs/stats");
}
