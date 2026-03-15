"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/src/shared/ui";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Severity = "critical" | "high" | "medium" | "low";
const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical（致命的）",
  high: "High（重大）",
  medium: "Medium（中程度）",
  low: "Low（軽微）",
};

type SubmitResult = {
  bug_number: number;
  title: string;
};

export default function ReportPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [environment, setEnvironment] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [reportedBy, setReportedBy] = useState("");
  const [version, setVersion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/public/bugs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          steps_to_reproduce: stepsToReproduce || null,
          environment: environment || null,
          severity,
          reported_by: reportedBy || null,
          version: version || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "送信に失敗しました");
      }
      const data = await res.json();
      setResult({ bug_number: data.bug_number, title: data.title });
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-semibold">報告を受け付けました</h1>
          <p className="text-muted-foreground">
            バグ番号:{" "}
            <span className="font-mono font-bold text-foreground">
              VIGIL-{String(result.bug_number).padStart(4, "0")}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            担当チームが確認次第、対応いたします。
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setResult(null);
              setTitle("");
              setDescription("");
              setStepsToReproduce("");
              setEnvironment("");
              setSeverity("medium");
              setReportedBy("");
              setVersion("");
            }}
          >
            別の問題を報告する
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">不具合を報告する</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            GitHubアカウントは不要です。気づいた問題を入力してください。
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              タイトル <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="どんな問題が起きているか（1〜2文）"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="詳細な説明、期待した動作と実際の動作など"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">再現手順</Label>
            <Textarea
              id="steps"
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. ○○を開く&#10;2. △△をクリックする"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>深刻度</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as Severity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SEVERITY_LABELS) as [Severity, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">バージョン</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.4.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="environment">環境</Label>
              <Input
                id="environment"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="Chrome / macOS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportedBy">お名前（任意）</Label>
              <Input
                id="reportedBy"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="田中 太郎"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !title}
            className="w-full"
          >
            {isSubmitting ? "送信中..." : "報告する"}
          </Button>
        </form>
      </div>
    </div>
  );
}
