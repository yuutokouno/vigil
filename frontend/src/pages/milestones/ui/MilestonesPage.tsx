"use client";

import { MilestoneList } from "@/src/widgets/milestone-list/ui/MilestoneList";

export function MilestonesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Milestones</h1>
      <MilestoneList />
    </div>
  );
}
