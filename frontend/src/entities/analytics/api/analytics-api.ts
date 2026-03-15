import { apiClient } from "@/src/shared/api/client";
import type {
  AnalyticsResponse,
  DiscoveryStagesResponse,
  HeatmapResponse,
} from "../model/types";

type AnalyticsFilters = {
  version?: string;
  discovery_stage?: string;
};

export async function fetchAnalytics(
  period: "7d" | "30d" | "90d" = "30d",
  compareTo?: "prev",
  filters?: AnalyticsFilters,
): Promise<AnalyticsResponse> {
  return apiClient<AnalyticsResponse>("/api/analytics", {
    params: {
      period,
      ...(compareTo ? { compare_to: compareTo } : {}),
      ...(filters?.version ? { version: filters.version } : {}),
      ...(filters?.discovery_stage
        ? { discovery_stage: filters.discovery_stage }
        : {}),
    },
  });
}

export async function fetchAnalyticsHeatmap(
  period: "7d" | "30d" | "90d" = "30d",
): Promise<HeatmapResponse> {
  return apiClient<HeatmapResponse>("/api/analytics/heatmap", {
    params: { period },
  });
}

export async function fetchDiscoveryStages(
  period: "7d" | "30d" | "90d" = "30d",
): Promise<DiscoveryStagesResponse> {
  return apiClient<DiscoveryStagesResponse>("/api/analytics/discovery-stages", {
    params: { period },
  });
}
