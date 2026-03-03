export const STATUS = {
  open: "open",
  in_progress: "in_progress",
  in_review: "in_review",
  closed: "closed",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_LABELS: Record<Status, string> = {
  open: "未対応",
  in_progress: "対応中",
  in_review: "検証待ち",
  closed: "クローズ",
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
  slack_message_url: string | null;
  github_issue_url: string | null;
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
};

export type BugUpdate = {
  title?: string | null;
  description?: string | null;
  status?: Status | null;
  severity?: Severity | null;
  priority?: Priority | null;
  category?: Category | null;
  assigned_to?: string | null;
  sprint?: string | null;
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
  status?: Status;
  severity?: Severity;
  category?: Category;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};
