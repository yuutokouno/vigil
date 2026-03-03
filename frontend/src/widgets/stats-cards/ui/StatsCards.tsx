"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import { STATUS_LABELS, type BugStats, type Status } from "@/src/entities/bug/model/types";

type StatsCardsProps = {
  stats: BugStats;
  onStatusClick?: (status: Status) => void;
};

const STATUS_ORDER: Status[] = ["open", "in_progress", "in_review", "closed"];

const STATUS_COLORS: Record<Status, string> = {
  open: "text-red-600",
  in_progress: "text-blue-600",
  in_review: "text-yellow-600",
  closed: "text-green-600",
};

export function StatsCards({ stats, onStatusClick }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STATUS_ORDER.map((status) => (
        <Card
          key={status}
          className={onStatusClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}
          onClick={() => onStatusClick?.(status)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {STATUS_LABELS[status]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${STATUS_COLORS[status]}`}>
              {stats.by_status[status] ?? 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
