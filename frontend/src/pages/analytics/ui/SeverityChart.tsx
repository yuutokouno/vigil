"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const SEVERITY_CONFIG: { key: string; label: string; color: string }[] = [
  { key: "critical", label: "Critical", color: "#EF4444" },
  { key: "high",     label: "High",     color: "#F97316" },
  { key: "medium",   label: "Medium",   color: "#EAB308" },
  { key: "low",      label: "Low",      color: "#22C55E" },
];

type Props = { bySeverity: Record<string, number> };

export function SeverityChart({ bySeverity }: Props) {
  const data = SEVERITY_CONFIG.map((s) => ({
    ...s,
    count: bySeverity[s.key] ?? 0,
  })).filter((d) => d.count > 0);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-xs text-muted-foreground">
        データなし
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={2}
              dataKey="count"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#16161A",
                border: "1px solid #252529",
                borderRadius: 6,
                fontSize: 12,
              }}
              formatter={(value: number, _name: string, props: { payload?: { label: string } }) => [
                value,
                props.payload?.label ?? "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold leading-none">{total}</span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">total</span>
        </div>
      </div>

      {/* Legend */}
      <ul className="flex flex-col gap-2.5 text-xs">
        {SEVERITY_CONFIG.map((s) => {
          const count = bySeverity[s.key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="w-14 text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums">{count}</span>
              <span className="text-muted-foreground tabular-nums">({pct}%)</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
