import { apiClient } from "@/src/shared/api/client";
import type { BugBashEvent, LeaderboardResponse } from "../model/types";

export async function listBugBashEvents(): Promise<BugBashEvent[]> {
  return apiClient<BugBashEvent[]>("/api/bug-bash");
}

export async function createBugBashEvent(data: {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}): Promise<BugBashEvent> {
  return apiClient<BugBashEvent>("/api/bug-bash", { method: "POST", body: data });
}

export async function getLeaderboard(eventId: string): Promise<LeaderboardResponse> {
  return apiClient<LeaderboardResponse>(`/api/bug-bash/${eventId}/leaderboard`);
}

export async function joinEvent(eventId: string): Promise<void> {
  return apiClient(`/api/bug-bash/${eventId}/join`, { method: "POST" });
}

export async function submitBug(eventId: string, bugId: string): Promise<void> {
  return apiClient(`/api/bug-bash/${eventId}/submit`, {
    method: "POST",
    body: { bug_id: bugId },
  });
}
