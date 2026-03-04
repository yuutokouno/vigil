"use client";

import Link from "next/link";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/src/shared/ui";
import type { Bug, Severity, Priority } from "@/src/entities/bug/model/types";
import type { Milestone } from "@/src/entities/milestone/model/types";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<Severity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  P0: "text-severity-critical",
  P1: "text-severity-high",
  P2: "text-muted-foreground",
  P3: "text-muted-foreground",
};

type KanbanCardProps = {
  bug: Bug;
  milestone?: Milestone;
};

export function KanbanCard({ bug, milestone }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bug.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-md border border-border bg-card p-3 text-[13px]",
        isDragging && "opacity-40"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2 top-2 cursor-grab touch-none p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="ドラッグして移動"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Severity dot + title */}
      <div className="flex items-start gap-2 pr-5">
        <span
          className={cn(
            "mt-1 h-2 w-2 shrink-0 rounded-full",
            SEVERITY_DOT[bug.severity]
          )}
        />
        <Link
          href={`/bugs/${bug.id}`}
          className="font-medium leading-snug text-foreground hover:underline"
        >
          {bug.title}
        </Link>
      </div>

      {/* Footer: priority + milestone + assignee */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn("text-[11px] font-semibold", PRIORITY_COLORS[bug.priority])}>
          {bug.priority}
        </span>

        {milestone && (
          <Badge
            variant="outline"
            className="h-4 border-border px-1.5 text-[11px] font-normal text-muted-foreground"
          >
            {milestone.title}
          </Badge>
        )}

        {bug.assigned_to && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {bug.assigned_to}
          </span>
        )}
      </div>
    </div>
  );
}
