"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, BarChart2 } from "lucide-react";
import { Button } from "@/src/shared/ui";
import {
  createScenario,
  deleteScenario,
  getScenarioPriorities,
  listScenarios,
} from "@/src/entities/test-scenario/api/test-scenario-api";
import type {
  TestScenario,
  TestScenarioPriority,
} from "@/src/entities/test-scenario/model/types";

export function TestScenariosPage() {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [priorities, setPriorities] = useState<TestScenarioPriority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [form, setForm] = useState({ title: "", feature_tag: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listScenarios();
      setScenarios(data);
    } catch {
      setScenarios([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPriorities = useCallback(async () => {
    try {
      const data = await getScenarioPriorities(30);
      setPriorities(data);
    } catch {
      setPriorities([]);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleShowPriority = () => {
    if (!showPriority) fetchPriorities();
    setShowPriority((v) => !v);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.feature_tag) return;
    setIsSubmitting(true);
    try {
      const created = await createScenario({
        title: form.title,
        feature_tag: form.feature_tag,
        description: form.description || null,
      });
      setScenarios((prev) => [created, ...prev]);
      setForm({ title: "", feature_tag: "", description: "" });
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このシナリオを削除しますか？")) return;
    await deleteScenario(id);
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">シナリオテスト</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShowPriority}>
            <BarChart2 className="mr-1 h-4 w-4" />
            優先度スコア
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" />
            新規シナリオ
          </Button>
        </div>
      </div>

      {/* Priority view */}
      {showPriority && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-medium">リスクスコア（直近30日）</h2>
          {priorities.length === 0 ? (
            <p className="text-sm text-muted-foreground">データなし</p>
          ) : (
            <div className="space-y-2">
              {priorities.slice(0, 10).map((p) => (
                <div key={p.scenario.id} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-right font-mono font-semibold text-orange-500">
                    {p.score.toFixed(1)}
                  </span>
                  <span className="flex-1 truncate">{p.scenario.title}</span>
                  <span className="text-muted-foreground text-xs">
                    [{p.scenario.feature_tag}] {p.bug_count} bugs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border p-4 space-y-3"
        >
          <h2 className="text-sm font-medium">新規シナリオ作成</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                タイトル <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="ログインフロー確認"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                feature_tag <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.feature_tag}
                onChange={(e) => setForm((f) => ({ ...f, feature_tag: e.target.value }))}
                placeholder="auth"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              説明
            </label>
            <textarea
              className="w-full rounded-md border px-3 py-1.5 text-sm"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="テストシナリオの概要"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      )}

      {/* Scenario list */}
      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">読み込み中...</p>
      ) : scenarios.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          シナリオが登録されていません
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between px-4 py-3 hover:bg-muted/30"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-medium truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                    {s.feature_tag}
                  </span>
                  {s.description && (
                    <span className="ml-2 truncate">{s.description}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                className="ml-4 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                aria-label="削除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
