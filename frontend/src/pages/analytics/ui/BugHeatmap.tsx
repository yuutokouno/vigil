"use client";

import type { HeatmapResponse } from "@/src/entities/analytics/model/types";

type Props = {
  data: HeatmapResponse;
};

// Returns a Tailwind bg class based on relative intensity (0-4 scale)
function cellColorClass(count: number, max: number): string {
  if (count === 0) return "bg-secondary";
  const level = Math.ceil((count / max) * 4);
  const classes = [
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/60",
    "bg-primary/80",
  ];
  return classes[Math.min(level - 1, 3)];
}

const LEGEND_CLASSES = [
  "bg-secondary",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/60",
  "bg-primary/80",
];

export function BugHeatmap({ data }: Props) {
  const { weeks, categories, cells } = data;

  const countMap = new Map(
    cells.map((c) => [`${c.week}::${c.category}`, c.count]),
  );
  const max = Math.max(...cells.map((c) => c.count), 1);

  if (weeks.length === 0 || categories.length === 0) {
    return (
      <p className="py-6 text-center text-[12px] text-muted-foreground">
        データなし
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[11px]">
        <thead>
          <tr>
            <th className="w-28 pr-2 text-right font-normal text-muted-foreground" />
            {weeks.map((w) => (
              <th
                key={w}
                className="w-10 pb-1 text-center font-normal text-muted-foreground"
                title={w}
              >
                {/* Show only the week number (e.g. "W10" from "2026-W10") */}
                W{w.split("-W")[1]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat}>
              <td className="pr-2 text-right text-muted-foreground">{cat}</td>
              {weeks.map((w) => {
                const count = countMap.get(`${w}::${cat}`) ?? 0;
                return (
                  <td key={w} className="p-0.5">
                    <div
                      className={`h-7 w-9 rounded-sm transition-colors ${cellColorClass(count, max)}`}
                      title={`${w} / ${cat}: ${count}件`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>少</span>
        {LEGEND_CLASSES.map((cls) => (
          <div key={cls} className={`h-3.5 w-4 rounded-sm ${cls}`} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
