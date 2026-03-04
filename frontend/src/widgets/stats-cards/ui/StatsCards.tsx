import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import type { BugStats } from "@/src/entities/bug/model/types";
import type { WorkflowColumn } from "@/src/entities/workflow-column/model/types";

type StatsCardsProps = {
  stats: BugStats;
  columns: WorkflowColumn[];
  onStatusClick?: (status: string) => void;
};

const STATUS_COLORS: Record<string, string> = {
  open:        "text-status-open",
  in_progress: "text-status-in-progress",
  in_review:   "text-status-in-review",
  closed:      "text-status-closed",
};

const DEFAULT_COLOR = "text-foreground";

export function StatsCards({ stats, columns, onStatusClick }: StatsCardsProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {columns.map((column) => (
        <Card
          key={column.slug}
          className={`min-w-[120px] flex-1 ${onStatusClick ? "cursor-pointer transition-colors hover:bg-secondary" : ""}`}
          onClick={() => onStatusClick?.(column.slug)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {column.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${STATUS_COLORS[column.slug] ?? DEFAULT_COLOR}`}>
              {stats.by_status[column.slug] ?? 0}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
