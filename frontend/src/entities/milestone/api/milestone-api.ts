import { apiClient } from "@/src/shared/api/client";
import type {
  Milestone,
  MilestoneCreate,
  MilestoneUpdate,
} from "@/src/entities/milestone/model/types";

export async function createMilestone(
  data: MilestoneCreate
): Promise<Milestone> {
  return apiClient<Milestone>("/api/milestones", {
    method: "POST",
    body: data,
  });
}

export async function listMilestones(): Promise<Milestone[]> {
  return apiClient<Milestone[]>("/api/milestones");
}

export async function getMilestone(id: string): Promise<Milestone> {
  return apiClient<Milestone>(`/api/milestones/${id}`);
}

export async function updateMilestone(
  id: string,
  data: MilestoneUpdate
): Promise<Milestone> {
  return apiClient<Milestone>(`/api/milestones/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteMilestone(id: string): Promise<void> {
  return apiClient<void>(`/api/milestones/${id}`, { method: "DELETE" });
}
