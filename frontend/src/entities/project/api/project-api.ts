import { apiClient } from "@/src/shared/api/client";
import type { Project } from "../model/types";

export async function listProjects(): Promise<Project[]> {
  return apiClient<Project[]>("/api/projects");
}

export async function switchProject(projectId: string): Promise<{ token: string; project_id: string; org_id: string }> {
  return apiClient<{ token: string; project_id: string; org_id: string }>(
    `/api/auth/switch-project`,
    { method: "POST", params: { project_id: projectId } },
  );
}
