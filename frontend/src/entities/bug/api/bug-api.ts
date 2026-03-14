import { apiClient } from "@/src/shared/api/client";
import { getToken } from "@/src/shared/lib/auth-token";
import type {
  Attachment,
  Bug,
  BugCreate,
  BugListParams,
  BugListResponse,
  BugStats,
  BugUpdate,
} from "@/src/entities/bug/model/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export async function uploadAttachment(
  bugId: string,
  file: File,
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/bugs/${bugId}/attachments`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? "ファイルのアップロードに失敗しました");
  }

  return response.json();
}
