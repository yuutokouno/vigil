"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/src/shared/ui";
import {
  createRelease,
  generateChecklist,
  getChecklist,
  listReleases,
  updateChecklistItem,
  updateRelease,
} from "@/src/entities/release/api/release-api";
import type {
  ChecklistItem,
  Release,
  ReleaseStatus,
} from "@/src/entities/release/model/types";
import { RELEASE_STATUS_LABELS } from "@/src/entities/release/model/types";

export function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ version: "", release_date: "", status: "draft" as ReleaseStatus });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);

  const fetchReleases = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listReleases();
      setReleases(data);
    } catch {
      setReleases([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.version) return;
    setIsSubmitting(true);
    try {
      const created = await createRelease({
        version: form.version,
        release_date: form.release_date || null,
        status: form.status,
      });
      setReleases((prev) => [created, ...prev]);
      setForm({ version: "", release_date: "", status: "draft" });
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRelease = async (release: Release) => {
    setSelectedRelease(release);
    setIsChecklistLoading(true);
    try {
      const items = await getChecklist(release.id);
      setChecklist(items);
    } catch {
      setChecklist([]);
    } finally {
      setIsChecklistLoading(false);
    }
  };

  const handleGenerateChecklist = async () => {
    if (!selectedRelease) return;
    setIsGenerating(true);
    try {
      const result = await generateChecklist(selectedRelease.id, 10);
      setChecklist(result.items);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    if (!selectedRelease) return;
    const updated = await updateChecklistItem(
      selectedRelease.id,
      item.id,
      !item.is_checked
    );
    setChecklist((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleStatusChange = async (release: Release, status: ReleaseStatus) => {
    const updated = await updateRelease(release.id, { status });
    setReleases((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedRelease?.id === release.id) setSelectedRelease(updated);
  };

  const checkedCount = checklist.filter((c) => c.is_checked).length;
  const progress = checklist.length > 0 ? (checkedCount / checklist.length) * 100 : 0;

  const statusColor: Record<ReleaseStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">リリース管理</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" />
          新規リリース
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-medium">新規リリース作成</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                バージョン <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="v1.2.0"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                リリース日
              </label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.release_date}
                onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                ステータス
              </label>
              <select
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ReleaseStatus }))
                }
              >
                {(["draft", "active", "done"] as ReleaseStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {RELEASE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Release list */}
        <div className="space-y-2">
          {isLoading ? (
            <p className="py-4 text-center text-muted-foreground text-sm">読み込み中...</p>
          ) : releases.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              リリースが登録されていません
            </p>
          ) : (
            releases.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelectRelease(r)}
                className={`rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                  selectedRelease?.id === r.id ? "border-primary bg-muted/20" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-sm">{r.version}</span>
                  <select
                    value={r.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(r, e.target.value as ReleaseStatus)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer border-0 ${statusColor[r.status]}`}
                  >
                    {(["draft", "active", "done"] as ReleaseStatus[]).map((s) => (
                      <option key={s} value={s}>{RELEASE_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                {r.release_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    リリース日: {new Date(r.release_date).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Checklist panel */}
        <div className="rounded-lg border p-4 space-y-3">
          {selectedRelease ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">
                  <ClipboardList className="inline mr-1 h-4 w-4" />
                  {selectedRelease.version} チェックリスト
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateChecklist}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`mr-1 h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                  自動生成
                </Button>
              </div>

              {checklist.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{checkedCount}/{checklist.length} 完了</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {isChecklistLoading ? (
                <p className="text-center text-sm text-muted-foreground py-4">読み込み中...</p>
              ) : checklist.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  「自動生成」ボタンでチェックリストを作成してください
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 cursor-pointer hover:bg-muted/30 rounded p-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={item.is_checked}
                        onChange={() => handleToggleItem(item)}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className={`text-sm ${item.is_checked ? "line-through text-muted-foreground" : ""}`}>
                          {item.scenario?.title ?? "—"}
                        </p>
                        {item.scenario?.feature_tag && (
                          <span className="text-xs font-mono text-muted-foreground">
                            [{item.scenario.feature_tag}]
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              リリースを選択するとチェックリストが表示されます
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
