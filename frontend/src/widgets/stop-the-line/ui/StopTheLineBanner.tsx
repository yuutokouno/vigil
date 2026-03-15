"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  fetchStopTheLineStatus,
  type StopTheLineStatus,
} from "@/src/entities/stop-the-line/api/stop-the-line-api";

export function StopTheLineBanner() {
  const [status, setStatus] = useState<StopTheLineStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchStopTheLineStatus()
      .then(setStatus)
      .catch(() => {
        // Non-critical: silently ignore fetch errors (e.g. no Slack integration configured)
      });
  }, []);

  if (!status?.is_triggered || dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px]">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
      <div className="flex-1">
        <span className="font-semibold text-red-300">Stop the Line</span>
        <span className="ml-2 text-red-200/80">
          Critical: {status.critical_count}/{status.threshold_critical}件　High:{" "}
          {status.high_count}/{status.threshold_high}件
        </span>
        <span className="ml-2 text-red-200/60">
          — 未解決の重大バグがしきい値を超えています。新規開発より先にバグ対応を優先してください。
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-red-400/60 hover:text-red-300"
        aria-label="バナーを閉じる"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
