"use client";

import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings page is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
