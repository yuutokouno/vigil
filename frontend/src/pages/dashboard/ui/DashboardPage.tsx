"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/src/shared/ui";
import { getBugStats } from "@/src/entities/bug/api/bug-api";
import type { BugStats, Status } from "@/src/entities/bug/model/types";
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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">VIGIL</h1>
        <Button asChild>
          <Link href="/bugs/new">+ バグを報告</Link>
        </Button>
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
