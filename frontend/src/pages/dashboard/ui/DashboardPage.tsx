"use client";

import { useEffect, useState } from "react";
import { getBugStats } from "@/src/entities/bug/api/bug-api";
import type { BugStats } from "@/src/entities/bug/model/types";
import { listWorkflowColumns } from "@/src/entities/workflow-column/api/workflow-column-api";
import type { WorkflowColumn } from "@/src/entities/workflow-column/model/types";
import { ViewToggle } from "@/src/features/view-toggle/ui/ViewToggle";
import { StatsCards } from "@/src/widgets/stats-cards/ui/StatsCards";
import { BugList } from "@/src/widgets/bug-list/ui/BugList";

export function DashboardPage() {
  const [stats, setStats] = useState<BugStats | null>(null);
  const [columns, setColumns] = useState<WorkflowColumn[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => {
    getBugStats().then(setStats).catch(() => {});
    listWorkflowColumns().then(setColumns).catch(() => {});
  }, []);

  const handleStatusClick = (status: string) => {
    setStatusFilter((prev) => (prev === status ? undefined : status));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Issues</h1>
        <ViewToggle />
      </div>

      {stats && columns.length > 0 && (
        <StatsCards stats={stats} columns={columns} onStatusClick={handleStatusClick} />
      )}

      <BugList
        initialFilters={statusFilter ? { status: statusFilter } : undefined}
      />
    </div>
  );
}
