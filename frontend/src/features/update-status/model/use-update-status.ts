"use client";

import { useState } from "react";
import { updateBug } from "@/src/entities/bug/api/bug-api";
import type { Bug, Status } from "@/src/entities/bug/model/types";

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  open: ["in_progress"],
  in_progress: ["in_review"],
  in_review: ["closed"],
  closed: ["open"],
};

export function useUpdateStatus(bug: Bug, onUpdated: (bug: Bug) => void) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTransitions = VALID_TRANSITIONS[bug.status] ?? [];

  const changeStatus = async (newStatus: Status) => {
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

  return { changeStatus, allowedTransitions, isUpdating, error };
}
