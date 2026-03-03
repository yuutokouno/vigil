"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui";
import {
  SEVERITY,
  SEVERITY_LABELS,
  PRIORITY,
  CATEGORY,
  CATEGORY_LABELS,
  type BugCreate,
  type Severity,
  type Priority,
  type Category,
} from "@/src/entities/bug/model/types";
import { useCreateBug } from "../model/use-create-bug";

export function BugForm() {
  const { submit, isSubmitting, error } = useCreateBug();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [environment, setEnvironment] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [priority, setPriority] = useState<Priority>("P2");
  const [category, setCategory] = useState<Category | "">("");
  const [reportedBy, setReportedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: BugCreate = {
      title,
      description: description || null,
      steps_to_reproduce: stepsToReproduce || null,
      expected_behavior: expectedBehavior || null,
      actual_behavior: actualBehavior || null,
      environment: environment || null,
      severity,
      priority,
      category: category || null,
      reported_by: reportedBy || null,
      assigned_to: assignedTo || null,
    };
    submit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">
          タイトル <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="バグの概要を簡潔に"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="バグの詳細な説明"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="steps">再現手順</Label>
          <Textarea
            id="steps"
            value={stepsToReproduce}
            onChange={(e) => setStepsToReproduce(e.target.value)}
            placeholder="1. ○○を開く&#10;2. △△をクリック"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expected">期待する挙動</Label>
          <Textarea
            id="expected"
            value={expectedBehavior}
            onChange={(e) => setExpectedBehavior(e.target.value)}
            placeholder="本来こうなるべき"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actual">実際の挙動</Label>
          <Textarea
            id="actual"
            value={actualBehavior}
            onChange={(e) => setActualBehavior(e.target.value)}
            placeholder="実際にはこうなった"
            rows={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        <div className="space-y-2">
          <Label>優先度</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PRIORITY).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>カテゴリ</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger>
              <SelectValue placeholder="選択..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="reportedBy">報告者</Label>
          <Input
            id="reportedBy"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignedTo">担当者</Label>
          <Input
            id="assignedTo"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="environment">環境</Label>
          <Input
            id="environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="Chrome 120 / macOS"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/">キャンセル</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting || !title}>
          {isSubmitting ? "送信中..." : "報告する"}
        </Button>
      </div>
    </form>
  );
}
