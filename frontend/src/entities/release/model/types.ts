import type { TestScenario } from "@/src/entities/test-scenario/model/types";

export type ReleaseStatus = "draft" | "active" | "done";

export type Release = {
  id: string;
  project_id: string | null;
  version: string;
  release_date: string | null;
  status: ReleaseStatus;
  created_at: string;
  updated_at: string;
};

export type ReleaseCreate = {
  version: string;
  release_date?: string | null;
  status?: ReleaseStatus;
};

export type ReleaseUpdate = {
  version?: string | null;
  release_date?: string | null;
  status?: ReleaseStatus | null;
};

export type ChecklistItem = {
  id: string;
  scenario_id: string;
  release_id: string;
  is_checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  scenario: TestScenario | null;
};

export type GenerateChecklistResponse = {
  generated: number;
  items: ChecklistItem[];
};

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  draft: "下書き",
  active: "進行中",
  done: "完了",
};
