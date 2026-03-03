"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import type { Bug } from "@/src/entities/bug/model/types";

type BugCardProps = {
  bug: Bug;
};

export function BugCard({ bug }: BugCardProps) {
  return (
    <Link href={`/bugs/${bug.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={bug.severity} />
            <StatusBadge status={bug.status} />
          </div>
          <CardTitle className="text-base">{bug.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{bug.assigned_to ?? "未割当"}</span>
            <span>{new Date(bug.created_at).toLocaleDateString("ja-JP")}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
