// frontend/src/entities/integration/model/types.ts

export type SourceType = "slack" | "hubspot" | "notion";
export type Direction = "inbound" | "bidirectional";

export type FieldMapping = {
  from: string;
  to: string;
};

export type Integration = {
  id: string;
  name: string;
  source_type: SourceType;
  direction: Direction;
  is_active: boolean;
  trigger_rules: Record<string, unknown>;
  field_mappings: FieldMapping[];
  last_received_at: string | null;
  total_received: number;
  created_at: string;
};

export type IntegrationCreate = {
  name: string;
  source_type: SourceType;
  direction: Direction;
  credentials: Record<string, string>;
  trigger_rules: Record<string, unknown>;
  field_mappings: FieldMapping[];
};

export type IntegrationUpdate = {
  name?: string;
  is_active?: boolean;
  credentials?: Record<string, string>;
  trigger_rules?: Record<string, unknown>;
  field_mappings?: FieldMapping[];
};

export type IntegrationEvent = {
  id: string;
  integration_id: string;
  direction: Direction;
  status: "created" | "skipped" | "duplicate" | "error";
  source_ref: string | null;
  bug_id: string | null;
  error_message: string | null;
  created_at: string;
};

export type SchemaField = {
  key: string;
  label: string;
};
