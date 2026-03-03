"use client";

import Link from "next/link";
import { Button } from "@/src/shared/ui";
import { BugForm } from "@/src/features/create-bug/ui/BugForm";

export function CreateBugPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">バグを報告する</h1>
        <Button variant="outline" asChild>
          <Link href="/">一覧に戻る</Link>
        </Button>
      </div>
      <BugForm />
    </div>
  );
}
