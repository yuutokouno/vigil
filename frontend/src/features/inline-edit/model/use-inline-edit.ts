"use client";

import { useState } from "react";
import { updateBug } from "@/src/entities/bug/api/bug-api";
import type { Bug, BugUpdate } from "@/src/entities/bug/model/types";

export function useInlineEdit(bug: Bug, onUpdated: (bug: Bug) => void) {
  const [isSaving, setIsSaving] = useState(false);

  const save = async (field: keyof BugUpdate, value: string | null) => {
    const currentValue = bug[field as keyof Bug];
    if (currentValue === value) return;

    setIsSaving(true);

    // Optimistic update
    const optimisticBug = { ...bug, [field]: value };
    onUpdated(optimisticBug);

    try {
      const updated = await updateBug(bug.id, {
        [field]: value,
      } as BugUpdate);
      onUpdated(updated);
    } catch {
      // Revert on error
      onUpdated(bug);
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, save };
}
