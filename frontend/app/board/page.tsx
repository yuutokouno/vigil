"use client";

import { ViewToggle } from "@/src/features/view-toggle/ui/ViewToggle";

export default function BoardRoute() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <ViewToggle />
      </div>
      <p className="text-muted-foreground">
        カンバンボードは Step 10 で実装します
      </p>
    </div>
  );
}
