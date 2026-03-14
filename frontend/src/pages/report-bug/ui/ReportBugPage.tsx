"use client";

import { useState } from "react";
import { Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/shared/ui";
import { createPublicBug } from "@/src/entities/bug/api/public-bug-api";
import type { PublicBugCreate } from "@/src/entities/bug/api/public-bug-api";
import { SEVERITY_LABELS, type Severity } from "@/src/entities/bug/model/types";

type SubmitState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; bugNumber: string }
  | { type: "error"; message: string };

export function ReportBugPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [environment, setEnvironment] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [state, setState] = useState<SubmitState>({ type: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ type: "submitting" });

    const data: PublicBugCreate = {
      title,
      description: description || null,
      steps_to_reproduce: stepsToReproduce || null,
      environment: environment || null,
      severity,
    };

    try {
      const result = await createPublicBug(data);
      setState({ type: "success", bugNumber: result.bug_number });
    } catch (e) {
      setState({
        type: "error",
        message: e instanceof Error ? e.message : "送信に失敗しました",
      });
    }
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setStepsToReproduce("");
    setEnvironment("");
    setSeverity("medium");
    setState({ type: "idle" });
  };

  if (state.type === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 text-center shadow">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-green-500">ご報告ありがとうございます</p>
            <p className="text-muted-foreground text-sm">
              以下の番号でバグが登録されました。
            </p>
          </div>
          <div className="rounded-md bg-muted py-4">
            <p className="text-3xl font-bold tracking-widest">{state.bugNumber}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            この番号を控えておくと、後で担当者への問い合わせに使えます。
          </p>
          <Button onClick={handleReset} variant="outline" className="w-full">
            別のバグを報告する
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-6 rounded-lg border bg-card p-8 shadow">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">バグを報告する</h1>
          <p className="text-sm text-muted-foreground">
            発生した問題の概要を教えてください。
          </p>
        </div>

        {state.type === "error" && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {state.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">
              タイトル <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ログインボタンを押しても画面が遷移しない"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">発生環境</Label>
            <Input
              id="environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="例: Chrome 120 / Windows 11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">再現手順</Label>
            <Textarea
              id="steps"
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. ○○ページを開く&#10;2. △△をクリックする&#10;3. エラーが発生する"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">詳細説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="その他、気になった点や補足情報があれば記載してください"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>深刻度</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={state.type === "submitting" || !title}
            className="w-full"
          >
            {state.type === "submitting" ? "送信中..." : "報告する"}
          </Button>
        </form>
      </div>
    </div>
  );
}
