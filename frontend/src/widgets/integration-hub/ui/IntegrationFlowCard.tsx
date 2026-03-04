"use client";

import { useState } from "react";
import { ArrowRight, Settings, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { cn } from "@/lib/utils";
import type { Integration } from "@/src/entities/integration/model/types";
import { IntegrationEventLog } from "./IntegrationEventLog";

const SOURCE_LABELS: Record<string, string> = {
  slack: "Slack",
  hubspot: "HubSpot",
  notion: "Notion",
};

const SOURCE_COLORS: Record<string, string> = {
  slack: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  hubspot: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  notion: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
};

function TriggerSummary({ sourceType, rules }: { sourceType: string; rules: Record<string, unknown> }) {
  if (sourceType === "slack") {
    const reactions = (rules.reactions as string[]) ?? [];
    const keywords = (rules.keywords as string[]) ?? [];
    const parts = [
      reactions.length > 0 && reactions.map((r) => `:${r}:`).join(" "),
      keywords.length > 0 && keywords.slice(0, 3).join(", "),
    ].filter(Boolean);
    return <span className="text-xs text-muted-foreground">{parts.join(" or ") || "すべてのメッセージ"}</span>;
  }
  if (sourceType === "hubspot") {
    const statuses = (rules.ticket_status as string[]) ?? [];
    const priorities = (rules.priority as string[]) ?? [];
    return <span className="text-xs text-muted-foreground">{[statuses.join("/"), priorities.join("/")].filter(Boolean).join(" · ")}</span>;
  }
  return <span className="text-xs text-muted-foreground">-</span>;
}

type IntegrationFlowCardProps = {
  integration: Integration;
  onEdit: (integration: Integration) => void;
  onToggle: (integration: Integration) => void;
  onDelete: (integration: Integration) => void;
};

export function IntegrationFlowCard({ integration, onEdit, onToggle, onDelete }: IntegrationFlowCardProps) {
  const [logOpen, setLogOpen] = useState(false);
  const sourceLabel = SOURCE_LABELS[integration.source_type] ?? integration.source_type;
  const sourceColor = SOURCE_COLORS[integration.source_type] ?? "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  const rules = integration.trigger_rules as Record<string, unknown>;

  const lastReceived = integration.last_received_at
    ? new Date(integration.last_received_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={cn("rounded-lg border bg-card/80 p-4 backdrop-blur-sm transition-opacity", !integration.is_active && "opacity-60")}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", sourceColor)}>{sourceLabel}</span>
          <span className="font-medium text-sm">{integration.name}</span>
          <span className={cn("h-2 w-2 rounded-full", integration.is_active ? "bg-green-500" : "bg-muted-foreground")} />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => onToggle(integration)}>
            {integration.is_active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => onEdit(integration)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive" onClick={() => onDelete(integration)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium">{sourceLabel}</span>
          {rules.channels && Array.isArray(rules.channels) && (rules.channels as string[]).length > 0 && (
            <span className="text-[10px] text-muted-foreground">#{(rules.channels as string[])[0]}</span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium">トリガー条件</span>
          <TriggerSummary sourceType={integration.source_type} rules={rules} />
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium">Vigil Bugs</span>
          <span className="text-[10px] text-muted-foreground">自動登録</span>
        </div>
      </div>

      {/* Stats + log toggle */}
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span>今月: {integration.total_received}件受信</span>
        {lastReceived && <span>最終: {lastReceived}</span>}
        <button
          className="ml-auto flex cursor-pointer items-center gap-1 hover:text-foreground"
          onClick={() => setLogOpen((v) => !v)}
        >
          {logOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          受信ログ
        </button>
      </div>

      {/* Event log */}
      {logOpen && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border/50 bg-muted/20 px-3 py-1">
          <IntegrationEventLog integrationId={integration.id} />
        </div>
      )}
    </div>
  );
}
