"use client";

import { useEffect, useState } from "react";
import { getBugStats } from "@/src/entities/bug/api/bug-api";
import type { BugStats, Status } from "@/src/entities/bug/model/types";
import { ViewToggle } from "@/src/features/view-toggle/ui/ViewToggle";
import { StatsCards } from "@/src/widgets/stats-cards/ui/StatsCards";
import { BugList } from "@/src/widgets/bug-list/ui/BugList";

export function DashboardPage() {
  const [stats, setStats] = useState<BugStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | undefined>();

  useEffect(() => {
    getBugStats().then(setStats).catch(() => {});
  }, []);

  const handleStatusClick = (status: Status) => {
    setStatusFilter((prev) => (prev === status ? undefined : status));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <ViewToggle />
      </div>

      {stats && (
        <StatsCards stats={stats} onStatusClick={handleStatusClick} />
      )}

      <BugList
        initialFilters={statusFilter ? { status: statusFilter } : undefined}
      />
    </div>
  );
}
