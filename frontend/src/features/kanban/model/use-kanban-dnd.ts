"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { updateBug } from "@/src/entities/bug/api/bug-api";
import type { Bug, Status } from "@/src/entities/bug/model/types";

export function useKanbanDnd(
  bugs: Bug[],
  onBugsChange: (bugs: Bug[]) => void
) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const bugId = active.id as string;
    const newStatus = over.id as Status;

    const bug = bugs.find((b) => b.id === bugId);
    if (!bug || bug.status === newStatus) return;

    // Optimistic update — any status transition is allowed
    const updatedBugs = bugs.map((b) =>
      b.id === bugId ? { ...b, status: newStatus } : b
    );
    onBugsChange(updatedBugs);

    try {
      await updateBug(bugId, { status: newStatus });
    } catch {
      onBugsChange(bugs); // revert on error
    }
  };

  return { handleDragEnd };
}
