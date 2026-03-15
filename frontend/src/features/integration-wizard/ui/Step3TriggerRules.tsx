// frontend/src/features/integration-wizard/ui/Step3TriggerRules.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { SourceType } from "@/src/entities/integration/model/types";

type TagInputProps = {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
};

function TagInput({ label, values, onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-md border bg-background p-2 min-h-[40px]">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="cursor-pointer">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder="入力して Enter"
        />
      </div>
    </div>
  );
}

type Props = {
  sourceType: SourceType;
  triggerRules: Record<string, unknown>;
  onRulesChange: (rules: Record<string, unknown>) => void;
};

export function Step3TriggerRules({ sourceType, triggerRules, onRulesChange }: Props) {
  const rules = triggerRules;
  const updateRule = (key: string, val: unknown) => onRulesChange({ ...rules, [key]: val });

  if (sourceType === "slack") {
    return (
      <div className="space-y-4">
        <TagInput
          label="監視チャンネル (ID: C01XXXXX)"
          values={(rules.channels as string[]) ?? []}
          onChange={(v) => updateRule("channels", v)}
        />
        <TagInput
          label="トリガー絵文字 (名前のみ)"
          values={(rules.reactions as string[]) ?? ["bug"]}
          onChange={(v) => updateRule("reactions", v)}
        />
        <TagInput
          label="キーワード (どれか一致で発火)"
          values={(rules.keywords as string[]) ?? []}
          onChange={(v) => updateRule("keywords", v)}
        />
      </div>
    );
  }

  if (sourceType === "hubspot") {
    const STATUSES = ["new", "waiting_on_contact", "waiting_on_us"];
    const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
    const toggleList = (key: string, val: string) => {
      const cur = (rules[key] as string[]) ?? [];
      updateRule(key, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]);
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">チケットステータス</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = ((rules.ticket_status as string[]) ?? []).includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleList("ticket_status", s)}
                  className={`cursor-pointer rounded border px-3 py-1 text-xs transition-colors ${active ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted/50"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">優先度フィルター</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => {
              const active = ((rules.priority as string[]) ?? []).includes(p);
              return (
                <button key={p} type="button" onClick={() => toggleList("priority", p)}
                  className={`cursor-pointer rounded border px-3 py-1 text-xs transition-colors ${active ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted/50"}`}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <TagInput
          label="キーワード"
          values={(rules.keywords as string[]) ?? []}
          onChange={(v) => updateRule("keywords", v)}
        />
      </div>
    );
  }

  if (sourceType === "notion") {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">データベース ID</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={(rules.database_id as string) ?? ""}
            onChange={(e) => updateRule("database_id", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ポーリング間隔</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer"
            value={String((rules.poll_interval_minutes as number) ?? 5)}
            onChange={(e) => updateRule("poll_interval_minutes", Number(e.target.value))}
          >
            <option value="5">5分</option>
            <option value="15">15分</option>
            <option value="60">60分</option>
          </select>
        </div>
        <hr className="border-border" />
        <p className="text-xs text-muted-foreground">
          フィルター条件 — 指定した条件に一致するページのみバグとして取り込みます (省略可)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Status フィールド名</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="例: Status"
              value={(rules.filter_by_status_field as string) ?? ""}
              onChange={(e) => updateRule("filter_by_status_field", e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">フィルター値</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="例: Bug"
              value={(rules.filter_by_status_value as string) ?? ""}
              onChange={(e) => updateRule("filter_by_status_value", e.target.value || undefined)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Type フィールド名 (複数値 OR)</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="例: Type"
            value={(rules.filter_by_type_field as string) ?? ""}
            onChange={(e) => updateRule("filter_by_type_field", e.target.value || undefined)}
          />
        </div>
        <TagInput
          label="Type フィルター値 (どれか一致で取り込み)"
          values={(rules.filter_by_type_values as string[]) ?? []}
          onChange={(v) => updateRule("filter_by_type_values", v.length > 0 ? v : undefined)}
        />
      </div>
    );
  }

  return null;
}
