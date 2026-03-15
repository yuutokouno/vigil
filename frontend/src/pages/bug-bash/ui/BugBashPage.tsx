"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trophy, Users } from "lucide-react";
import { Button } from "@/src/shared/ui";
import {
  createBugBashEvent,
  getLeaderboard,
  joinEvent,
  listBugBashEvents,
} from "@/src/entities/bug-bash/api/bug-bash-api";
import type { BugBashEvent, LeaderboardResponse } from "@/src/entities/bug-bash/model/types";
import { BUG_BASH_STATUS_LABELS } from "@/src/entities/bug-bash/model/types";

const STATUS_BADGE_CLASS: Record<BugBashEvent["status"], string> = {
  active: "bg-green-500/20 text-green-400",
  scheduled: "bg-blue-500/20 text-blue-400",
  completed: "bg-secondary text-muted-foreground",
};

export function BugBashPage() {
  const [events, setEvents] = useState<BugBashEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BugBashEvent | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listBugBashEvents();
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.start_time || !form.end_time) return;
    setIsSubmitting(true);
    try {
      const created = await createBugBashEvent({
        title: form.title,
        description: form.description || undefined,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });
      setEvents((prev) => [created, ...prev]);
      setForm({ title: "", description: "", start_time: "", end_time: "" });
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectEvent = async (event: BugBashEvent) => {
    setSelectedEvent(event);
    setIsLeaderboardLoading(true);
    try {
      const data = await getLeaderboard(event.id);
      setLeaderboard(data);
    } catch {
      setLeaderboard(null);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const handleJoin = async (eventId: string) => {
    setIsJoining(true);
    try {
      await joinEvent(eventId);
    } finally {
      setIsJoining(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const dateOpts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return `${s.toLocaleString("ja-JP", dateOpts)} - ${e.toLocaleString("ja-JP", dateOpts)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Bug Bash</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" />
          新規 Bug Bash 作成
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <h2 className="text-sm font-medium">新規 Bug Bash イベント</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                タイトル <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Sprint 42 Bug Bash"
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">説明</label>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="イベントの目的・スコープを記入（任意）"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                開始日時 <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                終了日時 <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Event list */}
        <div className="space-y-2">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">読み込み中...</p>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Bug Bash イベントがありません
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className={`rounded-lg border border-border bg-card p-3 cursor-pointer transition-colors hover:bg-muted/30 ${
                  selectedEvent?.id === event.id
                    ? "border-primary bg-muted/20"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {event.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_CLASS[event.status]}`}
                  >
                    {BUG_BASH_STATUS_LABELS[event.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateRange(event.start_time, event.end_time)}
                </p>
                {event.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {event.description}
                  </p>
                )}
                {event.status === "active" && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      disabled={isJoining}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoin(event.id);
                      }}
                    >
                      <Users className="mr-1 h-3 w-3" />
                      参加する
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Leaderboard panel */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          {selectedEvent ? (
            <>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">
                  {selectedEvent.title} - リーダーボード
                </h2>
              </div>

              {isLeaderboardLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">読み込み中...</p>
              ) : !leaderboard || leaderboard.participants.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  まだバグの提出がありません
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10">
                          順位
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          参加者
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          件数
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          スコア
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.participants.map((participant, index) => (
                        <tr
                          key={participant.user_id}
                          className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                                index === 0
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : index === 1
                                  ? "bg-slate-400/20 text-slate-400"
                                  : index === 2
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {participant.avatar_url ? (
                                <img
                                  src={participant.avatar_url}
                                  alt={participant.name}
                                  className="h-5 w-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                                  {participant.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm text-foreground">{participant.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-foreground">
                            {participant.bug_count}
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-semibold text-foreground">
                            {participant.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-3 py-2 bg-muted/10 border-t border-border">
                    <p className="text-[11px] text-muted-foreground">
                      スコア: critical=4pt / high=3pt / medium=2pt / low=1pt
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              イベントを選択するとリーダーボードが表示されます
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
