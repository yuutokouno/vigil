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
  const r = triggerRules;
  const set = (key: string, val: unknown) => onRulesChange({ ...r, [key]: val });

  if (sourceType === "slack") {
    return (
      <div className="space-y-4">
        <TagInput
          label="監視チャンネル (ID: C01XXXXX)"
          values={(r.channels as string[]) ?? []}
          onChange={(v) => set("channels", v)}
        />
        <TagInput
          label="トリガー絵文字 (名前のみ)"
          values={(r.reactions as string[]) ?? ["bug"]}
          onChange={(v) => set("reactions", v)}
        />
        <TagInput
          label="キーワード (どれか一致で発火)"
          values={(r.keywords as string[]) ?? []}
          onChange={(v) => set("keywords", v)}
        />
      </div>
    );
  }

  if (sourceType === "hubspot") {
    const STATUSES = ["new", "waiting_on_contact", "waiting_on_us"];
    const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
    const toggleList = (key: string, val: string) => {
      const cur = (r[key] as string[]) ?? [];
      set(key, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]);
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">チケットステータス</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = ((r.ticket_status as string[]) ?? []).includes(s);
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
              const active = ((r.priority as string[]) ?? []).includes(p);
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
          values={(r.keywords as string[]) ?? []}
          onChange={(v) => set("keywords", v)}
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
            value={(r.database_id as string) ?? ""}
            onChange={(e) => set("database_id", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ポーリング間隔</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer"
            value={String((r.poll_interval_minutes as number) ?? 5)}
            onChange={(e) => set("poll_interval_minutes", Number(e.target.value))}
          >
            <option value="5">5分</option>
            <option value="15">15分</option>
            <option value="60">60分</option>
          </select>
        </div>
      </div>
    );
  }

  return null;
}
