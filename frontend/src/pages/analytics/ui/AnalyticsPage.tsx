"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import { fetchAnalytics } from "@/src/entities/analytics/api/analytics-api";
import type { AnalyticsResponse } from "@/src/entities/analytics/model/types";
import { BugTrendChart } from "./BugTrendChart";
import { SeverityChart } from "./SeverityChart";
import { AssigneeTable } from "./AssigneeTable";

type Period = "7d" | "30d" | "90d";

function formatCloseTime(hours: number): string {
  if (hours < 1) return "1時間未満";
  const days = Math.floor(hours / 24);
  const remainHours = Math.round(hours % 24);
  if (days === 0) return `${Math.round(hours)}時間`;
  if (remainHours === 0) return `${days}日`;
  return `${days}日${remainHours}時間`;
}

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7\u65e5",
  "30d": "30\u65e5",
  "90d": "90\u65e5",
};

export function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchAnalytics(
        period,
        compareEnabled ? "prev" : undefined,
      );
      setData(res);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setIsError(true);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [period, compareEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-border text-[12px]">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 transition-colors first:rounded-l-md last:rounded-r-md ${
                  period === p
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCompareEnabled((v) => !v)}
            className={`rounded-md border border-border px-3 py-1 text-[12px] transition-colors ${
              compareEnabled
                ? "border-primary bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {"\u524d\u671f\u9593\u3068\u6bd4\u8f03"}
          </button>
        </div>
      </div>

      {isError && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-[12px] text-muted-foreground">
            {"\u30c7\u30fc\u30bf\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f"}
          </p>
          <button
            onClick={load}
            className="rounded-md border border-border px-4 py-1.5 text-[12px] text-foreground transition-colors hover:bg-secondary"
          >
            {"\u518d\u8a66\u884c"}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="py-16 text-center text-[12px] text-muted-foreground">
          {"\u8aad\u307f\u8fbc\u307f\u4e2d..."}
        </p>
      ) : !isError && !data ? (
        <p className="py-16 text-center text-[12px] text-muted-foreground">
          {"\u30c7\u30fc\u30bf\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f"}
        </p>
      ) : !isError && data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "\u767a\u751f\u30d0\u30b0\uff08\u5408\u8a08\uff09",
                value: data.current.daily.reduce((s, d) => s + d.created, 0),
              },
              {
                label: "\u89e3\u6c7a\u30d0\u30b0\uff08\u5408\u8a08\uff09",
                value: data.current.daily.reduce((s, d) => s + d.closed, 0),
              },
              {
                label: "\u5e73\u5747\u30af\u30ed\u30fc\u30ba\u6642\u9593",
                value: formatCloseTime(data.current.avg_close_hours),
              },
              {
                label: "\u30a2\u30af\u30c6\u30a3\u30d6\u30de\u30a4\u30eb\u30b9\u30c8\u30fc\u30f3",
                value: data.milestones.length,
              },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {kpi.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px]">
                {"\u30d0\u30b0\u767a\u751f / \u89e3\u6c7a\u30c8\u30ec\u30f3\u30c9"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BugTrendChart
                current={data.current.daily}
                previous={data.previous?.daily}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px]">Severity {"\u5225\u5185\u8a33"}</CardTitle>
              </CardHeader>
              <CardContent>
                <SeverityChart bySeverity={data.current.by_severity} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px]">
                  {"\u62c5\u5f53\u8005\u5225 \u30af\u30ed\u30fc\u30ba\u6570"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssigneeTable assignees={data.current.by_assignee} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
