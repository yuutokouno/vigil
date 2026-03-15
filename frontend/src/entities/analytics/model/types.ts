export type DailyPoint = {
  date: string;
  created: number;
  closed: number;
};

export type AssigneeStats = {
  name: string;
  closed: number;
};

export type MilestoneStat = {
  id: string;
  title: string;
  total: number;
  closed: number;
  rate: number;
};

export type PeriodStats = {
  daily: DailyPoint[];
  avg_close_hours: number;
  by_severity: Record<string, number>;
  by_assignee: AssigneeStats[];
};

export type AnalyticsResponse = {
  period: "7d" | "30d" | "90d";
  current: PeriodStats;
  previous: PeriodStats | null;
  milestones: MilestoneStat[];
};

export type HeatmapCell = {
  week: string;
  category: string;
  count: number;
};

export type HeatmapResponse = {
  weeks: string[];
  categories: string[];
  cells: HeatmapCell[];
};
