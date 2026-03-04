import { apiClient } from "@/src/shared/api/client";
import type { AnalyticsResponse } from "../model/types";

export async function fetchAnalytics(
  period: "7d" | "30d" | "90d" = "30d",
  compareTo?: "prev",
): Promise<AnalyticsResponse> {
  return apiClient<AnalyticsResponse>("/api/analytics", {
    params: {
      period,
      ...(compareTo ? { compare_to: compareTo } : {}),
    },
  });
}
