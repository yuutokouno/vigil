// frontend/src/entities/integration/api/integration-api.ts
import { apiClient } from "@/src/shared/api/client";
import type {
  Integration,
  IntegrationCreate,
  IntegrationEvent,
  IntegrationUpdate,
  SchemaField,
  SourceType,
} from "@/src/entities/integration/model/types";

export async function listIntegrations(): Promise<Integration[]> {
  return apiClient<Integration[]>("/api/integrations");
}

export async function createIntegration(data: IntegrationCreate): Promise<Integration> {
  return apiClient<Integration>("/api/integrations", {
    method: "POST",
    body: data,
  });
}

export async function getIntegration(id: string): Promise<Integration> {
  return apiClient<Integration>(`/api/integrations/${id}`);
}

export async function updateIntegration(id: string, data: IntegrationUpdate): Promise<Integration> {
  return apiClient<Integration>(`/api/integrations/${id}`, { method: "PATCH", body: data });
}

export async function deleteIntegration(id: string): Promise<void> {
  return apiClient<void>(`/api/integrations/${id}`, { method: "DELETE" });
}

export async function testIntegration(id: string): Promise<{ ok: boolean }> {
  return apiClient<{ ok: boolean }>(`/api/integrations/${id}/test`, { method: "POST" });
}

export async function listIntegrationEvents(
  id: string,
  limit = 50
): Promise<IntegrationEvent[]> {
  return apiClient<IntegrationEvent[]>(`/api/integrations/${id}/events`, {
    params: { limit },
  });
}

export async function fetchSourceSchema(
  sourceType: SourceType,
  credentials: Record<string, string>
): Promise<SchemaField[]> {
  return apiClient<SchemaField[]>(`/api/integrations/schema/${sourceType}`, {
    method: "POST",
    body: credentials,
  });
}
