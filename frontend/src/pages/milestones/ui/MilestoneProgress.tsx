"use client";

import { useEffect, useState } from "react";
import { listMilestones } from "@/src/entities/milestone/api/milestone-api";
import type { Milestone } from "@/src/entities/milestone/model/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";

export function MilestoneProgress() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listMilestones()
      .then((data) => setMilestones(data.filter((m) => m.status === "active")))
      .catch(() => setMilestones([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || milestones.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px]">進捗サマリー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.map((m) => {
            const rate =
              m.total_bugs > 0
                ? Math.round((m.closed_bugs / m.total_bugs) * 100)
                : 0;
            return (
              <div key={m.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-foreground">
                    {m.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {m.closed_bugs}/{m.total_bugs} ({rate}%)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${rate}%`,
                      background: rate === 100 ? "#22C55E" : "#5E6AD2",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
