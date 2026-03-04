"use client";

import { useCallback, useEffect, useState } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { listBugs } from "@/src/entities/bug/api/bug-api";
import type { Bug, Status } from "@/src/entities/bug/model/types";
import { listMilestones } from "@/src/entities/milestone/api/milestone-api";
import type { Milestone } from "@/src/entities/milestone/model/types";
import { KanbanColumn } from "@/src/features/kanban/ui/KanbanColumn";
import { useKanbanDnd } from "@/src/features/kanban/model/use-kanban-dnd";

const STATUS_ORDER: Status[] = ["open", "in_progress", "in_review", "closed"];

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
    listMilestones().then(setMilestones).catch(() => {});
  }, []);

  const { handleDragEnd } = useKanbanDnd(bugs, setBugs);

  const bugsByStatus = (status: Status) =>
    bugs.filter((b) => b.status === status);

  if (isLoading) {
    return (
      <p className="text-center text-muted-foreground">読み込み中...</p>
    );
  }

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            bugs={bugsByStatus(status)}
            milestones={milestones}
          />
        ))}
      </div>
    </DndContext>
  );
}
