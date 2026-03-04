"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Bug } from "@/src/entities/bug/model/types";
import type { Milestone } from "@/src/entities/milestone/model/types";
import type { WorkflowColumn } from "@/src/entities/workflow-column/model/types";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";

const STATUS_DOT_COLORS: Record<string, string> = {
  open: "bg-status-open",
  in_progress: "bg-status-in-progress",
  in_review: "bg-status-in-review",
  closed: "bg-status-closed",
};

const DEFAULT_DOT_COLOR = "bg-muted-foreground";

type KanbanColumnProps = {
  column: WorkflowColumn;
  bugs: Bug[];
  milestones?: Milestone[];
};

export function KanbanColumn({ column, bugs, milestones }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.slug });
  const dotColor = STATUS_DOT_COLORS[column.slug] ?? DEFAULT_DOT_COLOR;

  return (
    <div
      ref={setNodeRef}
      className="flex min-h-[200px] min-w-[280px] flex-col rounded-md border border-border bg-card/50 p-3"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
        <h3 className="flex-1 text-[13px] font-medium text-foreground">{column.name}</h3>
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
