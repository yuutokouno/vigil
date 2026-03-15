"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import { StatusBadge } from "@/src/entities/bug/ui/StatusBadge";
import { SeverityBadge } from "@/src/entities/bug/ui/SeverityBadge";
import { StatusSelect } from "@/src/features/update-status/ui/StatusSelect";
import type { Bug } from "@/src/entities/bug/model/types";
import {
  CATEGORY_LABELS,
  DISCOVERY_STAGE_LABELS,
  type Category,
  type DiscoveryStage,
} from "@/src/entities/bug/model/types";
import { listWorkflowColumns } from "@/src/entities/workflow-column/api/workflow-column-api";
import type { WorkflowColumn } from "@/src/entities/workflow-column/model/types";
import { AttachmentSection } from "./AttachmentSection";

type BugDetailProps = {
  bug: Bug;
};

export function BugDetail({ bug: initialBug }: BugDetailProps) {
  const [bug, setBug] = useState(initialBug);
  const [columns, setColumns] = useState<WorkflowColumn[]>([]);

  useEffect(() => {
    listWorkflowColumns().then(setColumns).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={bug.severity} />
            <StatusBadge status={bug.status} />
            <span className="text-sm text-muted-foreground">{bug.priority}</span>
          </div>
          <h1 className="text-2xl font-bold">{bug.title}</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">一覧に戻る</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ステータス変更</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusSelect bug={bug} onUpdated={setBug} allColumns={columns} />
        </CardContent>
      </Card>

      {bug.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">説明</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{bug.description}</p>
          </CardContent>
        </Card>
      )}

      {(bug.steps_to_reproduce || bug.expected_behavior || bug.actual_behavior) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {bug.steps_to_reproduce && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">再現手順</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{bug.steps_to_reproduce}</p>
              </CardContent>
            </Card>
          )}
          {bug.expected_behavior && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">期待する挙動</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{bug.expected_behavior}</p>
              </CardContent>
            </Card>
          )}
          {bug.actual_behavior && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">実際の挙動</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{bug.actual_behavior}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">詳細情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
            {bug.bug_number != null && (
              <div>
                <dt className="text-muted-foreground">バグ番号</dt>
                <dd className="font-medium font-mono">
                  VIGIL-{String(bug.bug_number).padStart(4, "0")}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">報告者</dt>
              <dd className="font-medium">{bug.reported_by ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">担当者</dt>
              <dd className="font-medium">{bug.assigned_to ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">カテゴリ</dt>
              <dd className="font-medium">
                {bug.category
                  ? CATEGORY_LABELS[bug.category as Category] ?? bug.category
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">環境</dt>
              <dd className="font-medium">{bug.environment ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">バージョン</dt>
              <dd className="font-medium">{bug.version ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">発見段階</dt>
              <dd className="font-medium">
                {bug.discovery_stage
                  ? DISCOVERY_STAGE_LABELS[bug.discovery_stage as DiscoveryStage] ??
                    bug.discovery_stage
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">登録日</dt>
              <dd className="font-medium">
                {new Date(bug.created_at).toLocaleString("ja-JP")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">更新日</dt>
              <dd className="font-medium">
                {new Date(bug.updated_at).toLocaleString("ja-JP")}
              </dd>
            </div>
            {bug.closed_at && (
              <div>
                <dt className="text-muted-foreground">クローズ日</dt>
                <dd className="font-medium">
                  {new Date(bug.closed_at).toLocaleString("ja-JP")}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">ソース</dt>
              <dd className="font-medium">{bug.source}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <AttachmentSection bugId={bug.id} />
    </div>
  );
}
