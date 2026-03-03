"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { SeverityBadge } from "@/src/entities/bug/ui/SeverityBadge";
import type { Bug } from "@/src/entities/bug/model/types";

type KanbanCardProps = {
  bug: Bug;
};

export function KanbanCard({ bug }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bug.id, data: { bug } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border bg-card p-3 shadow-sm hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-2 flex items-center gap-2">
        <SeverityBadge severity={bug.severity} />
        <span className="text-xs text-muted-foreground">{bug.priority}</span>
      </div>
      <Link
        href={`/bugs/${bug.id}`}
        className="text-sm font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {bug.title}
      </Link>
      <div className="mt-2 text-xs text-muted-foreground">
        {bug.assigned_to ?? "未割当"}
      </div>
    </div>
  );
}
