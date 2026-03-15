import { apiClient } from "@/src/shared/api/client";

export type StopTheLineStatus = {
  is_triggered: boolean;
  critical_count: number;
  high_count: number;
  threshold_critical: number;
  threshold_high: number;
};

export async function fetchStopTheLineStatus(): Promise<StopTheLineStatus> {
  return apiClient<StopTheLineStatus>("/api/stop-the-line/status");
}
