"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
};

type Props = {
  bySeverity: Record<string, number>;
};

export function SeverityChart({ bySeverity }: Props) {
  const data = Object.entries(bySeverity).map(([key, value]) => ({
    name: key,
    count: value,
    color: SEVERITY_COLORS[key] ?? "#6E6E7A",
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
      >
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6E6E7A" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6E6E7A" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#16161A",
            border: "1px solid #252529",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
