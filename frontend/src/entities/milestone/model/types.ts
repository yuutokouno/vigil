export type MilestoneStatus = "active" | "completed" | "cancelled";

export type Milestone = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: MilestoneStatus;
  created_at: string;
  updated_at: string;
  total_bugs: number;
  closed_bugs: number;
};

export type MilestoneCreate = {
  title: string;
  description?: string | null;
  due_date?: string | null;
};

export type MilestoneUpdate = {
  title?: string | null;
  description?: string | null;
  due_date?: string | null;
  status?: MilestoneStatus | null;
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  active: "進行中",
  completed: "完了",
  cancelled: "キャンセル",
};
