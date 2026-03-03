"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { listMilestones } from "@/src/entities/milestone/api/milestone-api";
import type { Milestone } from "@/src/entities/milestone/model/types";
import { MilestoneCard } from "@/src/entities/milestone/ui/MilestoneCard";
import { MilestoneForm } from "@/src/features/milestone/ui/MilestoneForm";
import { useCreateMilestone } from "@/src/features/milestone/model/use-create-milestone";

export function MilestoneList() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchMilestones = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listMilestones();
      setMilestones(data);
    } catch {
      setMilestones([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const { submit, isSubmitting } = useCreateMilestone((created) => {
    setMilestones((prev) => [created, ...prev]);
    setIsFormOpen(false);
  });

  if (isLoading) {
    return (
      <p className="py-8 text-center text-muted-foreground">読み込み中...</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {milestones.length} 件のマイルストーン
        </p>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          新規マイルストーン
        </Button>
      </div>

      {isFormOpen && (
        <div className="rounded-lg border p-4">
          <MilestoneForm
            onSubmit={submit}
            isSubmitting={isSubmitting}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      )}

      {milestones.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          マイルストーンが登録されていません
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {milestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      )}
    </div>
  );
}
