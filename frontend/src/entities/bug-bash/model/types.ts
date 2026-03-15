export type BugBashStatus = "scheduled" | "active" | "completed";

export type BugBashEvent = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: BugBashStatus;
  created_at: string;
};

export type ParticipantScore = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  bug_count: number;
  score: number;
};

export type LeaderboardResponse = {
  event: BugBashEvent;
  participants: ParticipantScore[];
};

export const BUG_BASH_STATUS_LABELS: Record<BugBashStatus, string> = {
  scheduled: "予定",
  active: "開催中",
  completed: "終了",
};
