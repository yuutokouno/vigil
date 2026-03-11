"use client";

import { MilestoneList } from "@/src/widgets/milestone-list/ui/MilestoneList";
import { MilestoneProgress } from "./MilestoneProgress";

export function MilestonesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Milestones</h1>
      <MilestoneProgress />
      <MilestoneList />
    </div>
  );
}
