import type { MilestoneStat } from "@/src/entities/analytics/model/types";

type Props = {
  milestones: MilestoneStat[];
};

export function MilestoneProgress({ milestones }: Props) {
  if (milestones.length === 0) {
    return (
      <p className="py-4 text-center text-[12px] text-muted-foreground">
        アクティブなマイルストーンなし
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {milestones.map((m) => (
        <div key={m.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-foreground">
              {m.title}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {m.closed}/{m.total} ({m.rate}%)
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${m.rate}%`,
                background: m.rate === 100 ? "#22C55E" : "#5E6AD2",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
