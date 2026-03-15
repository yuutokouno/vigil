"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import {
  listAttachments,
  uploadAttachment,
} from "@/src/entities/attachment/api/attachment-api";
import type { Attachment } from "@/src/entities/attachment/model/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AttachmentSectionProps = {
  bugId: string;
};

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentSection({ bugId }: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listAttachments(bugId).then(setAttachments).catch(() => {});
  }, [bugId]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadError(null);
      try {
        for (const file of Array.from(files)) {
          const attachment = await uploadAttachment(bugId, file);
          setAttachments((prev) => [...prev, attachment]);
        }
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "アップロード失敗");
      } finally {
        setUploading(false);
      }
    },
    [bugId],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">添付ファイル</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 text-sm transition-colors ${
            isDragging
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          {uploading ? (
            <span>アップロード中...</span>
          ) : (
            <>
              <span>ドラッグ&ドロップ</span>
              <span className="mt-1 text-xs">またはクリックしてファイルを選択</span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploadError && (
          <p className="text-xs text-red-500">{uploadError}</p>
        )}

        {/* File list */}
        {attachments.length > 0 && (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <a
                  href={`${BASE_URL}${a.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {a.file_name}
                </a>
                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {formatBytes(a.file_size)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
