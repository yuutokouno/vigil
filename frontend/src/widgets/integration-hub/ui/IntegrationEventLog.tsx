"use client";

import { useEffect, useState } from "react";
import { CheckCircle, SkipForward, Copy, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listIntegrationEvents } from "@/src/entities/integration/api/integration-api";
import type { IntegrationEvent } from "@/src/entities/integration/model/types";

const STATUS_CONFIG: Record<
  IntegrationEvent["status"],
  { icon: React.ElementType; color: string; label: string }
> = {
  created:   { icon: CheckCircle,  color: "text-green-500",         label: "作成" },
  skipped:   { icon: SkipForward,  color: "text-muted-foreground",   label: "スキップ" },
  duplicate: { icon: Copy,         color: "text-amber-500",          label: "重複" },
  error:     { icon: AlertCircle,  color: "text-destructive",        label: "エラー" },
};

type Props = { integrationId: string };

export function IntegrationEventLog({ integrationId }: Props) {
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    listIntegrationEvents(integrationId, 50)
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch(() => { if (!cancelled) setError("ログの取得に失敗しました"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [integrationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="py-3 text-center text-xs text-destructive">{error}</p>;
  }

  if (events.length === 0) {
    return <p className="py-3 text-center text-xs text-muted-foreground">受信ログはありません</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {events.map((event) => {
        const cfg = STATUS_CONFIG[event.status];
        const Icon = cfg.icon;
        const ts = new Date(event.created_at).toLocaleString("ja-JP", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <li key={event.id} className="flex items-start gap-2 py-1.5 text-xs">
            <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cfg.color)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                {event.source_ref && (
                  <span className="truncate text-muted-foreground">{event.source_ref}</span>
                )}
                {event.bug_id && (
                  <span className="ml-auto shrink-0 text-muted-foreground">→ Bug #{event.bug_id.slice(0, 8)}</span>
                )}
              </div>
              {event.error_message && (
                <p className="mt-0.5 text-destructive/80">{event.error_message}</p>
              )}
            </div>
            <span className="shrink-0 text-muted-foreground">{ts}</span>
          </li>
        );
      })}
    </ul>
  );
}
