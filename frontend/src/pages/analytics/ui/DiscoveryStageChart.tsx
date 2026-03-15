"use client";

import type { DiscoveryStageCount } from "@/src/entities/analytics/model/types";

type Props = {
  stages: DiscoveryStageCount[];
};

// Display labels and colors for known discovery stages
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  internal:  { label: "Internal",  color: "#6366F1" },
  qa:        { label: "QA",        color: "#3B82F6" },
  aegis:     { label: "Aegis",     color: "#8B5CF6" },
  customer:  { label: "Customer",  color: "#F97316" },
  unknown:   { label: "Unknown",   color: "#6B7280" },
};

function stageConfig(stage: string): { label: string; color: string } {
  return STAGE_CONFIG[stage] ?? { label: stage, color: "#6B7280" };
}

export function DiscoveryStageChart({ stages }: Props) {
  if (stages.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-xs text-muted-foreground">
        データなし
      </div>
    );
  }

  const total = stages.reduce((sum, s) => sum + s.count, 0);
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-3">
      {stages.map((s) => {
        const cfg = stageConfig(s.stage);
        const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
        const barPct = Math.round((s.count / max) * 100);

        return (
          <div key={s.stage} className="flex items-center gap-3 text-xs">
            {/* Stage label */}
            <span className="w-20 shrink-0 text-right text-muted-foreground">
              {cfg.label}
            </span>

            {/* Bar */}
            <div className="flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-5 rounded-full transition-all"
                style={{
                  width: `${barPct}%`,
                  background: cfg.color,
                  minWidth: s.count > 0 ? "4px" : "0",
                }}
              />
            </div>

            {/* Count + percent */}
            <span className="w-12 shrink-0 text-right tabular-nums text-foreground">
              {s.count}
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
              ({pct}%)
            </span>
          </div>
        );
      })}

      {/* Total */}
      <div className="border-t border-border pt-2 text-right text-xs text-muted-foreground">
        合計 <span className="font-medium text-foreground">{total}</span> 件
      </div>
    </div>
  );
}
