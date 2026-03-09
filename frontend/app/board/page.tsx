"use client";

import { ViewToggle } from "@/src/features/view-toggle/ui/ViewToggle";
import { KanbanBoard } from "@/src/widgets/kanban-board/ui/KanbanBoard";

export default function BoardRoute() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Board</h1>
        <ViewToggle />
      </div>
      <KanbanBoard />
    </div>
  );
}
