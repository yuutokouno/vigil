export const STATUS = {
  open: "open",
  in_progress: "in_progress",
  in_review: "in_review",
  closed: "closed",
} as const;

// Status is now any string (workflow column slug)
export type Status = string;

// Fallback labels for the built-in statuses.
// For dynamic slugs added by users, look up WorkflowColumn.name instead.
export const STATUS_LABELS: Record<string, string> = {
  open: "\u672a\u5bfe\u5fdc",
  in_progress: "\u5bfe\u5fdc\u4e2d",
  in_review: "\u691c\u8a3c\u5f85\u3061",
  closed: "\u30af\u30ed\u30fc\u30ba",
};

export const SEVERITY = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const PRIORITY = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

export const CATEGORY = {
  ui: "ui",
  api: "api",
  type_error: "type_error",
  auth: "auth",
  data: "data",
  performance: "performance",
  other: "other",
} as const;

export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];

export const CATEGORY_LABELS: Record<Category, string> = {
  ui: "UI",
  api: "API",
  type_error: "型エラー",
  auth: "認証",
  data: "データ",
  performance: "パフォーマンス",
  other: "その他",
};

export const DISCOVERY_STAGE = {
  internal: "internal",
  qa: "qa",
  aegis: "aegis",
  customer: "customer",
} as const;

export type DiscoveryStage = (typeof DISCOVERY_STAGE)[keyof typeof DISCOVERY_STAGE];

export const DISCOVERY_STAGE_LABELS: Record<DiscoveryStage, string> = {
  internal: "内部テスト",
  qa: "QA",
  aegis: "Aegis",
  customer: "顧客報告",
};

export type Bug = {
  id: string;
  title: string;
  description: string | null;
  steps_to_reproduce: string | null;
  expected_behavior: string | null;
  actual_behavior: string | null;
  environment: string | null;
  status: Status;
  severity: Severity;
  priority: Priority;
  category: Category | null;
  reported_by: string | null;
  assigned_to: string | null;
  source: string;
  sprint: string | null;
  milestone_id: string | null;
  slack_message_url: string | null;
  github_issue_url: string | null;
  version: string | null;
  discovery_stage: DiscoveryStage | null;
  bug_number: number | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type BugCreate = {
  title: string;
  description?: string | null;
  steps_to_reproduce?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  environment?: string | null;
  severity?: Severity;
  priority?: Priority;
  category?: Category | null;
  reported_by?: string | null;
  assigned_to?: string | null;
  sprint?: string | null;
  milestone_id?: string | null;
  version?: string | null;
  discovery_stage?: DiscoveryStage | null;
};

export type BugUpdate = {
  title?: string | null;
  description?: string | null;
  status?: string | null;
  severity?: Severity | null;
  priority?: Priority | null;
  category?: Category | null;
  assigned_to?: string | null;
  sprint?: string | null;
  milestone_id?: string | null;
};

export type BugListResponse = {
  items: Bug[];
  total: number;
  page: number;
  limit: number;
};

export type BugStats = {
  total: number;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  by_category: Record<string, number>;
};

export type BugListParams = {
  status?: string;
  severity?: Severity;
  category?: Category;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};
