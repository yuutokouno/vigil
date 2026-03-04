"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  STATUS_LABELS,
  type Bug,
  type Status,
} from "@/src/entities/bug/model/types";
import type { Milestone } from "@/src/entities/milestone/model/types";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";

const STATUS_DOT_COLORS: Record<Status, string> = {
  open: "bg-status-open",
  in_progress: "bg-status-in-progress",
  in_review: "bg-status-in-review",
  closed: "bg-status-closed",
};

type KanbanColumnProps = {
  status: Status;
  bugs: Bug[];
  milestones?: Milestone[];
};

export function KanbanColumn({ status, bugs, milestones }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="flex min-h-[200px] min-w-[280px] flex-col rounded-md border border-border bg-card/50 p-3"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT_COLORS[status])} />
        <h3 className="flex-1 text-[13px] font-medium text-foreground">{STATUS_LABELS[status]}</h3>
        <span className="text-[11px] text-muted-foreground">{bugs.length}</span>
      </div>

      <SortableContext
        items={bugs.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {bugs.map((bug) => {
            const milestone = milestones?.find((m) => m.id === bug.milestone_id);
            return <KanbanCard key={bug.id} bug={bug} milestone={milestone} />;
          })}
        </div>
      </SortableContext>
    </div>
  );
}
