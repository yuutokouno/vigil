"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { listBugs } from "@/src/entities/bug/api/bug-api";
import type { Bug, Status, Severity } from "@/src/entities/bug/model/types";
import { listMilestones } from "@/src/entities/milestone/api/milestone-api";
import type { Milestone } from "@/src/entities/milestone/model/types";
import { KanbanColumn } from "@/src/features/kanban/ui/KanbanColumn";
import { useKanbanDnd } from "@/src/features/kanban/model/use-kanban-dnd";
import { cn } from "@/lib/utils";

const STATUS_ORDER: Status[] = ["open", "in_progress", "in_review", "closed"];

const SEVERITY_DOT: Record<Severity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
};

export function KanbanBoard() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const fetchBugs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listBugs({ limit: 100 });
      setBugs(response.items);
    } catch {
      setBugs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  useEffect(() => {
    listMilestones().then(setMilestones).catch((err) => {
      console.error("Failed to load milestones:", err);
    });
  }, []);

  const { activeId, handleDragStart, handleDragOver, handleDragEnd } =
    useKanbanDnd(bugs, setBugs);

  // 8px activation distance prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeBug = activeId ? bugs.find((b) => b.id === activeId) : null;

  if (isLoading) {
    return (
      <p className="text-center text-muted-foreground">{"\u8aad\u307f\u8fbc\u307f\u4e2d..."}</p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            bugs={bugs.filter((b) => b.status === status)}
            milestones={milestones}
          />
        ))}
      </div>

      {/* Ghost card follows the cursor during drag */}
      <DragOverlay>
        {activeBug ? (
          <div className="rotate-1 cursor-grabbing rounded-md border border-border bg-card p-3 text-[13px] shadow-xl opacity-95">
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  SEVERITY_DOT[activeBug.severity]
                )}
              />
              <span className="font-medium leading-snug text-foreground">
                {activeBug.title}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
