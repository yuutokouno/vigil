"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import { StatusBadge } from "@/src/entities/bug/ui/StatusBadge";
import { SeverityBadge } from "@/src/entities/bug/ui/SeverityBadge";
import { StatusSelect } from "@/src/features/update-status/ui/StatusSelect";
import type { Bug, Attachment } from "@/src/entities/bug/model/types";
import {
  CATEGORY_LABELS,
  DISCOVERY_STAGE_LABELS,
  type Category,
  type DiscoveryStage,
} from "@/src/entities/bug/model/types";
import { listWorkflowColumns } from "@/src/entities/workflow-column/api/workflow-column-api";
import type { WorkflowColumn } from "@/src/entities/workflow-column/model/types";
import { uploadAttachment } from "@/src/entities/bug/api/bug-api";

type BugDetailProps = {
  bug: Bug;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function BugDetail({ bug: initialBug }: BugDetailProps) {
  const [bug, setBug] = useState(initialBug);
  const [columns, setColumns] = useState<WorkflowColumn[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>(initialBug.attachments ?? []);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listWorkflowColumns().then(setColumns).catch(() => {});
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        const attachment = await uploadAttachment(bug.id, file);
        uploaded.push(attachment);
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number | null): string => {
    if (bytes == null) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={bug.severity} />
            <StatusBadge status={bug.status} />
            <span className="text-sm text-muted-foreground">{bug.priority}</span>
            <span className="text-sm font-mono text-muted-foreground">
              VIGIL-{String(bug.bug_number).padStart(4, "0")}
            </span>
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

      {/* Attachment section (Issue #10) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">添付ファイル</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & drop upload zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50",
            ].join(" ")}
          >
            <p className="text-sm text-muted-foreground">
              {isUploading
                ? "アップロード中..."
                : "ファイルをここにドラッグ＆ドロップ、またはクリックして選択"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">最大 20 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}

          {/* Attachment list */}
          {attachments.length > 0 && (
            <ul className="divide-y rounded-md border text-sm">
              {attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <span className="truncate font-medium">{attachment.file_name}</span>
                  <div className="ml-4 flex shrink-0 items-center gap-4">
                    {attachment.file_size != null && (
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </span>
                    )}
                    <a
                      href={`${BASE_URL}${attachment.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      ダウンロード
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
