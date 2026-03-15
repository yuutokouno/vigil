"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui";
import {
  fetchAnalytics,
  fetchAnalyticsHeatmap,
} from "@/src/entities/analytics/api/analytics-api";
import type {
  AnalyticsResponse,
  HeatmapResponse,
} from "@/src/entities/analytics/model/types";
import { BugTrendChart } from "./BugTrendChart";
import { SeverityChart } from "./SeverityChart";
import { AssigneeTable } from "./AssigneeTable";
import { BugHeatmap } from "./BugHeatmap";

type Period = "7d" | "30d" | "90d";

const DISCOVERY_STAGE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "internal", label: "Internal" },
  { value: "qa", label: "QA" },
  { value: "aegis", label: "Aegis" },
  { value: "customer", label: "Customer" },
];

function formatCloseTime(hours: number): string {
  if (hours < 1) return "1時間未満";
  const days = Math.floor(hours / 24);
  const remainHours = Math.round(hours % 24);
  if (days === 0) return `${Math.round(hours)}時間`;
  if (remainHours === 0) return `${days}日`;
  return `${days}日${remainHours}時間`;
}

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7日",
  "30d": "30日",
  "90d": "90日",
};

export function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [version, setVersion] = useState("");
  const [discoveryStage, setDiscoveryStage] = useState("");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [res, heatRes] = await Promise.all([
        fetchAnalytics(
          period,
          compareEnabled ? "prev" : undefined,
          {
            version: version || undefined,
            discovery_stage: discoveryStage || undefined,
          },
        ),
        fetchAnalyticsHeatmap(period),
      ]);
      setData(res);
      setHeatmap(heatRes);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setIsError(true);
      setData(null);
      setHeatmap(null);
    } finally {
      setIsLoading(false);
    }
  }, [period, compareEnabled, version, discoveryStage]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Header + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-lg font-semibold tracking-tight">
          Analytics
        </h1>

        {/* Version filter */}
        <input
          type="text"
          placeholder="バージョン"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="h-7 w-28 rounded-md border border-border bg-transparent px-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Discovery stage filter */}
        <select
          value={discoveryStage}
          onChange={(e) => setDiscoveryStage(e.target.value)}
          className="h-7 rounded-md border border-border bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {DISCOVERY_STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Period selector */}
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

        {/* Compare toggle */}
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
                value: formatCloseTime(data.current.avg_close_hours),
              },
              {
                label: "アクティブマイルストーン",
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

          {/* Heatmap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px]">
                週次バグヒートマップ（カテゴリ別）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {heatmap ? (
                <BugHeatmap data={heatmap} />
              ) : (
                <p className="py-4 text-center text-[12px] text-muted-foreground">
                  データなし
                </p>
              )}
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
        </>
      ) : null}
    </div>
  );
}
