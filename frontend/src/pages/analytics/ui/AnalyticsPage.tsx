"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import { fetchAnalytics } from "@/src/entities/analytics/api/analytics-api";
import type { AnalyticsResponse } from "@/src/entities/analytics/model/types";
import { BugTrendChart } from "./BugTrendChart";
import { SeverityChart } from "./SeverityChart";
import { AssigneeTable } from "./AssigneeTable";
import { MilestoneProgress } from "./MilestoneProgress";

type Period = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7日",
  "30d": "30日",
  "90d": "90日",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Analytics</h1>
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
            前期間と比較
          </button>
        </div>
      </div>

      {isError && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-[12px] text-muted-foreground">
            データを取得できませんでした
          </p>
          <button
            onClick={load}
            className="rounded-md border border-border px-4 py-1.5 text-[12px] text-foreground transition-colors hover:bg-secondary"
          >
            再試行
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="py-16 text-center text-[12px] text-muted-foreground">
          読み込み中...
        </p>
      ) : !isError && !data ? (
        <p className="py-16 text-center text-[12px] text-muted-foreground">
          データを取得できませんでした
        </p>
      ) : !isError && data ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "発生バグ（合計）",
                value: data.current.daily.reduce((s, d) => s + d.created, 0),
              },
              {
                label: "解決バグ（合計）",
                value: data.current.daily.reduce((s, d) => s + d.closed, 0),
              },
              {
                label: "平均クローズ時間",
                value: `${data.current.avg_close_hours}h`,
              },
              {
                label: "アクティブマイルストーン",
                value: data.milestones.length,
              },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4">
                  <p className="text-[11px] text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {kpi.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trend chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px]">
                バグ発生 / 解決トレンド
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BugTrendChart
                current={data.current.daily}
                previous={data.previous?.daily}
              />
            </CardContent>
          </Card>

          {/* Severity + Assignee */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px]">Severity 別内訳</CardTitle>
              </CardHeader>
              <CardContent>
                <SeverityChart bySeverity={data.current.by_severity} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px]">
                  担当者別 クローズ数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssigneeTable assignees={data.current.by_assignee} />
              </CardContent>
            </Card>
          </div>

          {/* Milestone progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px]">マイルストーン進捗</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneProgress milestones={data.milestones} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
