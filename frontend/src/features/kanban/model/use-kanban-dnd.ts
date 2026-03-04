"use client";

import { useRef, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { updateBug } from "@/src/entities/bug/api/bug-api";
import type { Bug, Status } from "@/src/entities/bug/model/types";
import { STATUS } from "@/src/entities/bug/model/types";

export type MoveRecord = {
  bugId: string;
  bugTitle: string;
  fromStatus: Status;
  toStatus: Status;
};

/**
 * Resolves over.id to a Status.
 * over.id can be a column id (status string) or a card id (bug UUID).
 */
function resolveStatus(overId: string, bugs: Bug[]): Status | null {
  if ((Object.values(STATUS) as string[]).includes(overId)) {
    return overId as Status;
  }
  return bugs.find((b) => b.id === overId)?.status ?? null;
}

export function useKanbanDnd(
  bugs: Bug[],
  onBugsChange: (bugs: Bug[]) => void,
  onMoveComplete?: (move: MoveRecord) => void
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Refs avoid stale closures across async drag events
  const bugsRef = useRef(bugs);
  bugsRef.current = bugs;
  const originalBugRef = useRef<{ id: string; title: string; status: Status } | null>(null);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const bug = bugsRef.current.find((b) => b.id === active.id);
    setActiveId(active.id as string);
    originalBugRef.current = bug
      ? { id: bug.id, title: bug.title, status: bug.status }
      : null;
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const bugId = active.id as string;
    const newStatus = resolveStatus(String(over.id), bugsRef.current);
    if (!newStatus) return;
    const bug = bugsRef.current.find((b) => b.id === bugId);
    if (!bug || bug.status === newStatus) return;
    // Live preview: move card to target column immediately
    onBugsChange(
      bugsRef.current.map((b) => (b.id === bugId ? { ...b, status: newStatus } : b))
    );
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    const bugId = active.id as string;
    const orig = originalBugRef.current;
    setActiveId(null);
    originalBugRef.current = null;

    if (!over || !orig) {
      // Drag cancelled — revert live preview
      if (orig) {
        onBugsChange(
          bugsRef.current.map((b) => (b.id === bugId ? { ...b, status: orig.status } : b))
        );
      }
      return;
    }

    const newStatus = resolveStatus(String(over.id), bugsRef.current);
    if (!newStatus || newStatus === orig.status) return;

    try {
      await updateBug(bugId, { status: newStatus });
      onMoveComplete?.({
        bugId,
        bugTitle: orig.title,
        fromStatus: orig.status,
        toStatus: newStatus,
      });
    } catch {
      // Revert on API error
      onBugsChange(
        bugsRef.current.map((b) => (b.id === bugId ? { ...b, status: orig.status } : b))
      );
    }
  };

  return { activeId, handleDragStart, handleDragOver, handleDragEnd };
}
