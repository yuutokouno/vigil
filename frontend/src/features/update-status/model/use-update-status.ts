"use client";

import { useState } from "react";
import { updateBug } from "@/src/entities/bug/api/bug-api";
import type { Bug } from "@/src/entities/bug/model/types";
import type { WorkflowColumn } from "@/src/entities/workflow-column/model/types";

export function useUpdateStatus(
  bug: Bug,
  onUpdated: (bug: Bug) => void,
  allColumns: WorkflowColumn[]
) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All columns except the current one are valid targets
  const allowedColumns = allColumns.filter((c) => c.slug !== bug.status);

  const changeStatus = async (newStatus: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await updateBug(bug.id, { status: newStatus });
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ステータス変更に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  return { changeStatus, allowedColumns, isUpdating, error };
}
