"use client";

import { useState } from "react";
import { createMilestone } from "@/src/entities/milestone/api/milestone-api";
import type {
  Milestone,
  MilestoneCreate,
} from "@/src/entities/milestone/model/types";

export function useCreateMilestone(onCreated?: (milestone: Milestone) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: MilestoneCreate) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createMilestone(data);
      onCreated?.(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error };
}
