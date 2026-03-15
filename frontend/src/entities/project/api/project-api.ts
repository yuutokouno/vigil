import { apiClient } from "@/src/shared/api/client";
import type { Project } from "../model/types";

export type ProjectMember = {
  user_id: string;
  project_id: string;
  role: string;
  name: string;
  github_id: string;
  avatar_url: string | null;
};

export async function listProjects(): Promise<Project[]> {
  return apiClient<Project[]>("/api/projects");
}

export async function createProject(data: {
  name: string;
  slug?: string;
}): Promise<Project> {
  return apiClient<Project>("/api/projects", { method: "POST", body: data });
}

export async function switchProject(projectId: string): Promise<{ token: string; project_id: string; org_id: string }> {
  return apiClient<{ token: string; project_id: string; org_id: string }>(
    `/api/auth/switch-project`,
    { method: "POST", params: { project_id: projectId } },
  );
}

export async function listMembers(projectId: string): Promise<ProjectMember[]> {
  return apiClient<ProjectMember[]>(`/api/projects/${projectId}/members`);
}

export async function inviteMember(
  projectId: string,
  githubId: string,
  role: string = "member"
): Promise<ProjectMember> {
  return apiClient<ProjectMember>(`/api/projects/${projectId}/members`, {
    method: "POST",
    body: { github_id: githubId, role },
  });
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  return apiClient<void>(`/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}
