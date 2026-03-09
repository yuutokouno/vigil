"use client";

import Link from "next/link";
import { WorkflowColumnSettings } from "@/src/features/workflow-column-settings/ui/WorkflowColumnSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>

      {/* Navigation links to sub-settings pages */}
      <div className="flex gap-2 border-b pb-3">
        <Link
          href="/settings/integrations"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          連携管理
        </Link>
      </div>

      <WorkflowColumnSettings />
    </div>
  );
}
