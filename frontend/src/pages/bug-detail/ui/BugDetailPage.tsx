"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBug } from "@/src/entities/bug/api/bug-api";
import { BugDetail } from "@/src/widgets/bug-detail/ui/BugDetail";
import type { Bug } from "@/src/entities/bug/model/types";

export function BugDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [bug, setBug] = useState<Bug | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getBug(id)
      .then(setBug)
      .catch((e) => setError(e instanceof Error ? e.message : "取得に失敗しました"))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-red-600">{error ?? "バグが見つかりませんでした"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <BugDetail bug={bug} />
    </div>
  );
}
