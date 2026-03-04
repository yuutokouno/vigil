"use client";

import { WorkflowColumnSettings } from "@/src/features/workflow-column-settings/ui/WorkflowColumnSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      <WorkflowColumnSettings />
    </div>
  );
}
