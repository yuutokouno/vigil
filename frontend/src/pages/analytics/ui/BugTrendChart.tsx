"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailyPoint } from "@/src/entities/analytics/model/types";

type Props = {
  current: DailyPoint[];
  previous?: DailyPoint[] | null;
};

export function BugTrendChart({ current, previous }: Props) {
  // previous period data is aligned by index to overlay on current period's x-axis
  const data = current.map((c, i) => ({
    date: c.date.slice(5), // MM-DD
    created: c.created,
    closed: c.closed,
    prev_created: previous?.[i]?.created,
    prev_closed: previous?.[i]?.closed,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#252529" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6E6E7A" }}
          axisLine={{ stroke: "#252529" }}
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
          labelStyle={{ color: "#E2E2E5" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#6E6E7A" }} />
        <Line
          type="monotone"
          dataKey="created"
          stroke="#EF4444"
          strokeWidth={2}
          dot={false}
          name="発生"
        />
        <Line
          type="monotone"
          dataKey="closed"
          stroke="#22C55E"
          strokeWidth={2}
          dot={false}
          name="解決"
        />
        {previous && (
          <>
            <Line
              type="monotone"
              dataKey="prev_created"
              stroke="#EF4444"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name="発生（前期）"
            />
            <Line
              type="monotone"
              dataKey="prev_closed"
              stroke="#22C55E"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name="解決（前期）"
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
