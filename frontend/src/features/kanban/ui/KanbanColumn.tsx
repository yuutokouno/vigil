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

const STATUS_HEADER_COLORS: Record<Status, string> = {
  open: "border-t-red-500",
  in_progress: "border-t-blue-500",
  in_review: "border-t-yellow-500",
  closed: "border-t-green-500",
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
      className={cn(
        "flex min-h-[200px] min-w-[280px] flex-col rounded-lg border border-t-4 bg-muted/30 p-3",
        STATUS_HEADER_COLORS[status]
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
        <span className="text-xs text-muted-foreground">{bugs.length}</span>
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
