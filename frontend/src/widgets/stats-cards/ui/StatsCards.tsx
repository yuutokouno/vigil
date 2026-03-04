"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import { STATUS_LABELS, type BugStats, type Status } from "@/src/entities/bug/model/types";

type StatsCardsProps = {
  stats: BugStats;
  onStatusClick?: (status: Status) => void;
};

const STATUS_ORDER: Status[] = ["open", "in_progress", "in_review", "closed"];

// Map status values to design-system severity color tokens
const STATUS_COLORS: Record<Status, string> = {
  open: "text-severity-critical",
  in_progress: "text-severity-medium",
  in_review: "text-severity-high",
  closed: "text-severity-low",
};

export function StatsCards({ stats, onStatusClick }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STATUS_ORDER.map((status) => (
        <Card
          key={status}
          className={onStatusClick ? "cursor-pointer transition-colors hover:bg-secondary" : ""}
          onClick={() => onStatusClick?.(status)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {STATUS_LABELS[status]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${STATUS_COLORS[status]}`}>
              {stats.by_status[status] ?? 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
