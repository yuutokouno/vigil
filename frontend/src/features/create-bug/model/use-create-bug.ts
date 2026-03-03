"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBug } from "@/src/entities/bug/api/bug-api";
import type { BugCreate } from "@/src/entities/bug/model/types";

export function useCreateBug() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: BugCreate) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createBug(data);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error };
}
