# Vigil 全面改修 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Linear 風ダークUIへの全面リデザイン + Board ドラッグ修正 + マイルストーン連携 + 分析ダッシュボード構築

**Architecture:** デザインシステム（CSS変数）を先に固め、それを乗せながら Board・Milestone・Analytics の機能改修を並行して行う。外部連携は本スコープ外。

**Tech Stack:** Next.js 14, Tailwind CSS v3, shadcn/ui, @dnd-kit, Recharts (追加), FastAPI, SQLAlchemy async

---

## 前提確認

以下はすでに実装済みのため、本プランでは変更不要：
- `Bug.milestone_id` — バックエンドモデル / Pydanticスキーマ / フロント型定義すべて実装済み
- `BugForm` — マイルストーンセレクター UI 実装済み
- Milestone CRUD API — `/api/milestones` 完全実装済み

---

## Task 1: デザインシステム — CSS変数のダーク固定

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/layout.tsx`

### Step 1: globals.css を書き換え

`:root` の値を Linear 風ダークパレットで上書きし、`.dark` クラスとの差異をなくす（ダーク固定のため `.dark` ブロックは不要）。

`frontend/app/globals.css` の内容を以下で完全に置き換える：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Linear-inspired dark palette — fixed dark, no light mode */
    --background: 240 4% 4%;           /* #0A0A0B */
    --foreground: 240 5% 89%;          /* #E2E2E5 */

    --card: 240 5% 9%;                 /* #16161A */
    --card-foreground: 240 5% 89%;

    --popover: 240 4% 7%;              /* #111114 */
    --popover-foreground: 240 5% 89%;

    --primary: 235 53% 60%;            /* #5E6AD2 accent indigo */
    --primary-foreground: 0 0% 100%;

    --secondary: 240 5% 12%;           /* #1E1E24 hover */
    --secondary-foreground: 240 5% 89%;

    --muted: 240 5% 12%;
    --muted-foreground: 240 4% 45%;    /* #6E6E7A */

    --accent: 240 5% 12%;
    --accent-foreground: 240 5% 89%;

    --destructive: 0 84% 60%;          /* #EF4444 */
    --destructive-foreground: 0 0% 100%;

    --border: 240 5% 16%;              /* #252529 */
    --input: 240 5% 16%;
    --ring: 235 53% 60%;

    --sidebar: 240 4% 7%;              /* #111114 */
    --sidebar-foreground: 240 5% 89%;
    --sidebar-border: 240 5% 16%;
    --sidebar-accent: 240 5% 12%;
    --sidebar-accent-foreground: 240 5% 89%;

    --radius: 0.375rem;

    /* Severity colors — used via Tailwind arbitrary values */
    --severity-critical: 0 84% 60%;    /* #EF4444 */
    --severity-high: 25 95% 53%;       /* #F97316 */
    --severity-medium: 48 96% 53%;     /* #EAB308 */
    --severity-low: 142 71% 45%;       /* #22C55E */
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-size: 13px;
    letter-spacing: -0.01em;
  }
}
```

### Step 2: layout.tsx を書き換え（ダーク固定、ThemeProvider 除去）

`frontend/app/layout.tsx` を以下で置き換える：

```tsx
import type { Metadata } from "next";
import { AppShell } from "@/src/widgets/app-shell/ui/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vigil",
  description: "Bug tracking dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

### Step 3: tailwind.config.ts に severity カラーを追加

`frontend/tailwind.config.ts` の `colors` セクションに以下を追加（`ring` の後）：

```ts
severity: {
  critical: 'hsl(var(--severity-critical))',
  high: 'hsl(var(--severity-high))',
  medium: 'hsl(var(--severity-medium))',
  low: 'hsl(var(--severity-low))',
},
```

### Step 4: 動作確認

Docker コンテナが起動中なら http://localhost:3000 を開いてダーク背景になっていることを確認。

### Step 5: コミット

```bash
cd /Users/kounoyuuto/development/vigil
git add frontend/app/globals.css frontend/app/layout.tsx frontend/tailwind.config.ts
git commit -m "feat: Linear-inspired dark design system — fixed dark mode"
```

---

## Task 2: Sidebar リデザイン + Header 統合

**Files:**
- Modify: `frontend/src/widgets/app-shell/ui/Sidebar.tsx`
- Modify: `frontend/src/widgets/app-shell/ui/AppShell.tsx`
- Delete logic from: `frontend/src/widgets/app-shell/ui/Header.tsx` (ヘッダーを廃止してサイドバーに統合)

### Step 1: Sidebar.tsx を書き換え

Linear スタイルの新サイドバー。変更点：
- アクティブ状態 = accent 色の左ボーダー + subtle 背景
- フォントサイズ 13px、アイコン 16px
- `/analytics` ルートを追加（BarChart2 アイコン）
- フッターに認証情報（アバター + ログアウト）と「新規バグ」ボタン
- テーマトグルを廃止（ダーク固定のため不要）

`frontend/src/widgets/app-shell/ui/Sidebar.tsx` を以下で完全置き換え：

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  Kanban,
  Milestone,
  Settings,
  BarChart2,
  PanelLeftClose,
  PanelLeft,
  Plus,
  LogOut,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/src/shared/ui";
import { useAuth } from "@/src/features/auth/model/use-auth";
import { UserAvatar } from "@/src/entities/user/ui/UserAvatar";

const NAV_ITEMS = [
  { href: "/", label: "Issues", icon: Bug },
  { href: "/board", label: "Board", icon: Kanban },
  { href: "/milestones", label: "Milestones", icon: Milestone },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading, login, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        isCollapsed ? "w-[52px]" : "w-[220px]"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-3">
        {!isCollapsed && (
          <span className="mr-auto text-[13px] font-semibold tracking-widest text-foreground/90">
            VIGIL
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 text-muted-foreground hover:text-foreground",
            isCollapsed && "mx-auto"
          )}
          onClick={onToggle}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-1.5 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/bugs")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "border-l-2 border-primary bg-secondary pl-[6px] text-foreground"
                  : "border-l-2 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
                isCollapsed && "justify-center border-l-0 px-2 pl-2"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer: new bug + auth */}
      <div className="shrink-0 border-t border-sidebar-border px-1.5 py-2 space-y-1">
        {/* New bug button */}
        <Link
          href="/bugs/new"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>新規バグ</span>}
        </Link>

        {/* Auth */}
        {!isLoading && (
          <>
            {user ? (
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5",
                  isCollapsed && "justify-center"
                )}
              >
                <UserAvatar user={user} size={24} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate text-[12px] text-muted-foreground">
                      {user.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={logout}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  isCollapsed && "justify-center"
                )}
              >
                <Github className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Login</span>}
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
```

### Step 2: AppShell.tsx から Header を除去

`frontend/src/widgets/app-shell/ui/AppShell.tsx` を以下で置き換え：

```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
```

### Step 3: 動作確認

http://localhost:3000 でサイドバーが新デザインになっていること、ヘッダーがなくなっていることを確認。

### Step 4: コミット

```bash
git add frontend/src/widgets/app-shell/
git commit -m "feat: Linear-style sidebar with analytics nav + inline auth"
```

---

## Task 3: Board — ドラッグ修正 + マイルストーンバッジ

**Files:**
- Modify: `frontend/src/features/kanban/model/use-kanban-dnd.ts`
- Modify: `frontend/src/features/kanban/ui/KanbanCard.tsx`
- Modify: `frontend/src/features/kanban/ui/KanbanColumn.tsx`
- Modify: `frontend/src/widgets/kanban-board/ui/KanbanBoard.tsx`

### Step 1: use-kanban-dnd.ts — VALID_TRANSITIONS を除去

`frontend/src/features/kanban/model/use-kanban-dnd.ts` を以下で置き換え：

```ts
"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { updateBug } from "@/src/entities/bug/api/bug-api";
import type { Bug, Status } from "@/src/entities/bug/model/types";

export function useKanbanDnd(
  bugs: Bug[],
  onBugsChange: (bugs: Bug[]) => void
) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const bugId = active.id as string;
    const newStatus = over.id as Status;

    const bug = bugs.find((b) => b.id === bugId);
    if (!bug || bug.status === newStatus) return;

    // Optimistic update — any status transition is allowed
    const updatedBugs = bugs.map((b) =>
      b.id === bugId ? { ...b, status: newStatus } : b
    );
    onBugsChange(updatedBugs);

    try {
      await updateBug(bugId, { status: newStatus });
    } catch {
      onBugsChange(bugs); // revert on error
    }
  };

  return { handleDragEnd };
}
```

### Step 2: KanbanCard.tsx — ドラッグハンドル追加 + マイルストーンバッジ

`frontend/src/features/kanban/ui/KanbanCard.tsx` を以下で置き換え：

```tsx
"use client";

import Link from "next/link";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/src/shared/ui";
import type { Bug } from "@/src/entities/bug/model/types";
import type { Milestone } from "@/src/entities/milestone/model/types";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "text-severity-critical",
  P1: "text-severity-high",
  P2: "text-muted-foreground",
  P3: "text-muted-foreground",
};

type KanbanCardProps = {
  bug: Bug;
  milestone?: Milestone;
};

export function KanbanCard({ bug, milestone }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bug.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-md border border-border bg-card p-3 text-[13px]",
        isDragging && "opacity-40"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2 top-2 cursor-grab touch-none p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Severity dot + title */}
      <div className="flex items-start gap-2 pr-5">
        <span
          className={cn(
            "mt-1 h-2 w-2 shrink-0 rounded-full",
            SEVERITY_DOT[bug.severity] ?? "bg-muted"
          )}
        />
        <Link
          href={`/bugs/${bug.id}`}
          className="font-medium leading-snug text-foreground hover:underline"
        >
          {bug.title}
        </Link>
      </div>

      {/* Footer: priority + milestone + assignee */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn("text-[11px] font-semibold", PRIORITY_COLORS[bug.priority])}>
          {bug.priority}
        </span>

        {milestone && (
          <Badge
            variant="outline"
            className="h-4 border-border px-1.5 text-[11px] font-normal text-muted-foreground"
          >
            {milestone.title}
          </Badge>
        )}

        {bug.assigned_to && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {bug.assigned_to}
          </span>
        )}
      </div>
    </div>
  );
}
```

### Step 3: KanbanBoard.tsx — マイルストーンデータを読み込んでカードに渡す

`frontend/src/widgets/kanban-board/ui/KanbanBoard.tsx` を読み込んで確認してから、以下の変更を加える：

KanbanBoard の `useCallback`/`useEffect` でマイルストーン一覧を取得し、各カードに `milestone` prop を渡す。

KanbanBoard.tsx の先頭 import に追加：
```ts
import { listMilestones } from "@/src/entities/milestone/api/milestone-api";
import type { Milestone } from "@/src/entities/milestone/model/types";
```

state に追加：
```ts
const [milestones, setMilestones] = useState<Milestone[]>([]);
```

fetchBugs の useEffect の隣に追加：
```ts
useEffect(() => {
  listMilestones().then(setMilestones).catch(() => {});
}, []);
```

KanbanColumn に milestone lookup を渡す（KanbanCard に milestone prop を追加するため）。

KanbanCard の呼び出し側（KanbanColumn.tsx）で:
```tsx
const milestone = milestones.find((m) => m.id === bug.milestone_id);
// ...
<KanbanCard key={bug.id} bug={bug} milestone={milestone} />
```

※ KanbanColumn.tsx を読んで実際の実装に合わせて調整する。

### Step 4: KanbanColumn.tsx — 幅とスタイル調整

`frontend/src/features/kanban/ui/KanbanColumn.tsx` を読んで確認し、以下を変更：
- `min-w-[240px]` → `min-w-[280px]`
- カラムヘッダーのスタイルを Linear 風に（背景なし、細いセパレータ）
- milestones を props で受け取れるよう型追加

### Step 5: 動作確認

Board ページで任意のカードを任意のカラムにドラッグできることを確認。カードにマイルストーンバッジが表示されることを確認。

### Step 6: コミット

```bash
git add frontend/src/features/kanban/ frontend/src/widgets/kanban-board/
git commit -m "feat: board drag-any-transition + drag handle + milestone badge"
```

---

## Task 4: Analytics バックエンド

**Files:**
- Create: `backend/app/presentation/analytics.py`
- Modify: `backend/app/main.py`

### Step 1: analytics.py を作成

`backend/app/presentation/analytics.py`:

```python
from datetime import datetime, timedelta, date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.models import Bug, Milestone

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _period_days(period: str) -> int:
    return {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)


async def _compute_stats(session: AsyncSession, start: datetime, end: datetime) -> dict:
    # Daily created/closed
    daily_map: dict[date, dict] = {}
    delta = end.date() - start.date()
    for i in range(delta.days + 1):
        d = (start + timedelta(days=i)).date()
        daily_map[d] = {"date": d.isoformat(), "created": 0, "closed": 0}

    created_rows = await session.execute(
        select(func.date(Bug.created_at).label("d"), func.count().label("c"))
        .where(Bug.created_at >= start, Bug.created_at <= end)
        .group_by(func.date(Bug.created_at))
    )
    for row in created_rows:
        if row.d in daily_map:
            daily_map[row.d]["created"] = row.c

    closed_rows = await session.execute(
        select(func.date(Bug.closed_at).label("d"), func.count().label("c"))
        .where(Bug.closed_at >= start, Bug.closed_at <= end)
        .group_by(func.date(Bug.closed_at))
    )
    for row in closed_rows:
        if row.d in daily_map:
            daily_map[row.d]["closed"] = row.c

    # Average close time (hours) for bugs closed in this period
    avg_result = await session.execute(
        select(
            func.avg(
                func.extract("epoch", Bug.closed_at - Bug.created_at) / 3600
            )
        ).where(Bug.closed_at >= start, Bug.closed_at <= end, Bug.closed_at.isnot(None))
    )
    avg_close_hours = round(float(avg_result.scalar() or 0), 1)

    # Severity breakdown (open bugs in period)
    sev_rows = await session.execute(
        select(Bug.severity, func.count().label("c"))
        .where(Bug.created_at >= start, Bug.created_at <= end)
        .group_by(Bug.severity)
    )
    by_severity = {row.severity: row.c for row in sev_rows}

    # Assignee breakdown (closed in period)
    assignee_rows = await session.execute(
        select(Bug.assigned_to, func.count().label("c"))
        .where(
            Bug.closed_at >= start,
            Bug.closed_at <= end,
            Bug.assigned_to.isnot(None),
        )
        .group_by(Bug.assigned_to)
        .order_by(func.count().desc())
        .limit(10)
    )
    by_assignee = [
        {"name": row.assigned_to, "closed": row.c} for row in assignee_rows
    ]

    return {
        "daily": list(daily_map.values()),
        "avg_close_hours": avg_close_hours,
        "by_severity": by_severity,
        "by_assignee": by_assignee,
    }


@router.get("")
async def get_analytics(
    period: Literal["7d", "30d", "90d"] = Query("30d"),
    compare_to: Literal["prev"] | None = Query(None),
    session: AsyncSession = Depends(get_session),
) -> dict:
    days = _period_days(period)
    now = datetime.utcnow()
    current_start = now - timedelta(days=days)

    current = await _compute_stats(session, current_start, now)

    previous = None
    if compare_to == "prev":
        prev_end = current_start
        prev_start = prev_end - timedelta(days=days)
        previous = await _compute_stats(session, prev_start, prev_end)

    # Milestones with bug counts
    milestone_rows = await session.execute(
        select(
            Milestone.id,
            Milestone.title,
            Milestone.status,
            func.count(Bug.id).label("total"),
            func.sum(
                func.cast(Bug.status == "closed", type_=func.count().type)
            ).label("closed"),
        )
        .outerjoin(Bug, Bug.milestone_id == Milestone.id)
        .where(Milestone.status == "active")
        .group_by(Milestone.id, Milestone.title, Milestone.status)
    )

    milestones = []
    for row in milestone_rows:
        total = row.total or 0
        closed = int(row.closed or 0)
        milestones.append({
            "id": str(row.id),
            "title": row.title,
            "total": total,
            "closed": closed,
            "rate": round(closed / total * 100) if total > 0 else 0,
        })

    return {
        "period": period,
        "current": current,
        "previous": previous,
        "milestones": milestones,
    }
```

### Step 2: main.py にルーターを追加

`backend/app/main.py` を読んで、既存の router 登録コードを確認してから、以下を追加：

```python
from app.presentation.analytics import router as analytics_router
# ...
app.include_router(analytics_router)
```

### Step 3: 動作確認

```bash
curl http://localhost:8000/api/analytics?period=30d
curl http://localhost:8000/api/analytics?period=7d&compare_to=prev
```

200 が返り、`current.daily` に配列があることを確認。

### Step 4: コミット

```bash
git add backend/app/presentation/analytics.py backend/app/main.py
git commit -m "feat: add /api/analytics endpoint with period comparison"
```

---

## Task 5: Analytics フロントエンド

**Files:**
- Run: `docker compose exec frontend npm install recharts`
- Create: `frontend/app/analytics/page.tsx`
- Create: `frontend/src/pages/analytics/ui/AnalyticsPage.tsx`
- Create: `frontend/src/pages/analytics/ui/BugTrendChart.tsx`
- Create: `frontend/src/pages/analytics/ui/SeverityChart.tsx`
- Create: `frontend/src/pages/analytics/ui/AssigneeTable.tsx`
- Create: `frontend/src/pages/analytics/ui/MilestoneProgress.tsx`
- Create: `frontend/src/entities/analytics/api/analytics-api.ts`
- Create: `frontend/src/entities/analytics/model/types.ts`

### Step 1: recharts をインストール

```bash
docker compose exec frontend npm install recharts
docker compose exec frontend npm install @types/recharts --save-dev 2>/dev/null || true
```

※ recharts は TypeScript 型を内包しているので `@types/recharts` は不要な場合が多い。

### Step 2: 型定義

`frontend/src/entities/analytics/model/types.ts`:

```ts
export type DailyPoint = {
  date: string;
  created: number;
  closed: number;
};

export type AssigneeStats = {
  name: string;
  closed: number;
};

export type MilestoneStat = {
  id: string;
  title: string;
  total: number;
  closed: number;
  rate: number;
};

export type PeriodStats = {
  daily: DailyPoint[];
  avg_close_hours: number;
  by_severity: Record<string, number>;
  by_assignee: AssigneeStats[];
};

export type AnalyticsResponse = {
  period: "7d" | "30d" | "90d";
  current: PeriodStats;
  previous: PeriodStats | null;
  milestones: MilestoneStat[];
};
```

### Step 3: API クライアント

`frontend/src/entities/analytics/api/analytics-api.ts`:

```ts
import { apiClient } from "@/src/shared/api/client";
import type { AnalyticsResponse } from "../model/types";

export async function fetchAnalytics(
  period: "7d" | "30d" | "90d" = "30d",
  compareTo?: "prev"
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams({ period });
  if (compareTo) params.set("compare_to", compareTo);
  return apiClient<AnalyticsResponse>(`/api/analytics?${params}`);
}
```

### Step 4: BugTrendChart コンポーネント

`frontend/src/pages/analytics/ui/BugTrendChart.tsx`:

```tsx
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
  // Merge current + previous for overlay display
  const data = current.map((c, i) => ({
    date: c.date.slice(5), // MM-DD
    created: c.created,
    closed: c.closed,
    prev_created: previous?.[i]?.created,
    prev_closed: previous?.[i]?.closed,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
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
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#6E6E7A" }}
        />
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
```

### Step 5: SeverityChart コンポーネント

`frontend/src/pages/analytics/ui/SeverityChart.tsx`:

```tsx
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
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
```

### Step 6: AssigneeTable コンポーネント

`frontend/src/pages/analytics/ui/AssigneeTable.tsx`:

```tsx
import type { AssigneeStats } from "@/src/entities/analytics/model/types";

type Props = {
  assignees: AssigneeStats[];
};

export function AssigneeTable({ assignees }: Props) {
  if (assignees.length === 0) {
    return (
      <p className="py-4 text-center text-[12px] text-muted-foreground">
        データなし
      </p>
    );
  }

  const max = Math.max(...assignees.map((a) => a.closed));

  return (
    <div className="space-y-2">
      {assignees.map((a) => (
        <div key={a.name} className="flex items-center gap-3">
          <span className="w-24 truncate text-[12px] text-muted-foreground">
            {a.name}
          </span>
          <div className="flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${(a.closed / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-[12px] font-medium text-foreground">
            {a.closed}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Step 7: MilestoneProgress コンポーネント

`frontend/src/pages/analytics/ui/MilestoneProgress.tsx`:

```tsx
import type { MilestoneStat } from "@/src/entities/analytics/model/types";

type Props = {
  milestones: MilestoneStat[];
};

export function MilestoneProgress({ milestones }: Props) {
  if (milestones.length === 0) {
    return (
      <p className="py-4 text-center text-[12px] text-muted-foreground">
        アクティブなマイルストーンなし
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {milestones.map((m) => (
        <div key={m.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-foreground">
              {m.title}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {m.closed}/{m.total} ({m.rate}%)
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${m.rate}%`,
                background: m.rate === 100 ? "#22C55E" : "#5E6AD2",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Step 8: AnalyticsPage 本体

`frontend/src/pages/analytics/ui/AnalyticsPage.tsx`:

```tsx
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

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAnalytics(period, compareEnabled ? "prev" : undefined);
      setData(res);
    } catch {
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
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-[12px] text-muted-foreground">
          読み込み中...
        </p>
      ) : !data ? (
        <p className="py-16 text-center text-[12px] text-muted-foreground">
          データを取得できませんでした
        </p>
      ) : (
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
                  <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
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
              <CardTitle className="text-[13px]">バグ発生 / 解決トレンド</CardTitle>
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
                <CardTitle className="text-[13px]">担当者別 クローズ数</CardTitle>
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
```

### Step 9: ルートページ作成

`frontend/app/analytics/page.tsx`:

```tsx
"use client";

import { AnalyticsPage } from "@/src/pages/analytics/ui/AnalyticsPage";

export default function AnalyticsRoute() {
  return <AnalyticsPage />;
}
```

ディレクトリ作成が必要：
```bash
mkdir -p /Users/kounoyuuto/development/vigil/frontend/app/analytics
mkdir -p /Users/kounoyuuto/development/vigil/frontend/src/pages/analytics/ui
mkdir -p /Users/kounoyuuto/development/vigil/frontend/src/entities/analytics/api
mkdir -p /Users/kounoyuuto/development/vigil/frontend/src/entities/analytics/model
```

### Step 10: 動作確認

http://localhost:3000/analytics でページが表示されること、期間切り替えと前期間比較ボタンが機能することを確認。

### Step 11: コミット

```bash
git add frontend/app/analytics/ frontend/src/pages/analytics/ frontend/src/entities/analytics/
git commit -m "feat: analytics page with trend chart, severity breakdown, assignee table"
```

---

## Task 6: UI ポリッシュ — Issues リスト・カード・StatsCards

**Files:**
- Modify: `frontend/src/widgets/stats-cards/` (存在するファイルを確認してから修正)
- Modify: `frontend/src/widgets/bug-list/` (フィルターバー・テーブル)
- Modify: `frontend/src/entities/bug/ui/` (バッジ類)

### Step 1: ファイル確認

以下のファイルを Read して現状を把握：
- `frontend/src/widgets/stats-cards/ui/StatsCards.tsx`
- `frontend/src/widgets/bug-list/ui/BugList.tsx` またはその周辺
- `frontend/src/entities/bug/ui/SeverityBadge.tsx` （あれば）

### Step 2: StatsCards を Linear 風にリデザイン

StatsCards を読んで確認後、以下の方針で修正：
- カード: border のみ（shadow なし）、数値を大きく表示
- ラベルを `text-muted-foreground text-[11px]` に
- ステータス別の数値に severity カラーを使う

### Step 3: SeverityBadge / StatusBadge のカラーを新パレットに合わせる

severity の色表現を `--severity-*` CSS 変数ベースに統一。
shadcn Badge の `variant` を override する形で実装。

具体的には、バッジの inline スタイルではなく Tailwind クラスで：
```tsx
// severity → Tailwind クラスのマッピング
const SEVERITY_CLASSES = {
  critical: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
  high:     "bg-severity-high/15 text-severity-high border-severity-high/30",
  medium:   "bg-severity-medium/15 text-severity-medium border-severity-medium/30",
  low:      "bg-severity-low/15 text-severity-low border-severity-low/30",
};
```

### Step 4: ページタイトルの統一

全ページで `<h1>` のサイズ・ウェイトを統一：
- `text-lg font-semibold tracking-tight` (Linear は見出しを控えめなサイズで使う)

### Step 5: コミット

```bash
git add frontend/src/widgets/stats-cards/ frontend/src/widgets/bug-list/ frontend/src/entities/bug/ui/
git commit -m "feat: UI polish — stats cards, severity badges, page titles"
```

---

## 最終確認チェックリスト

- [ ] http://localhost:3000 — ダーク背景、新サイドバー、ヘッダーなし
- [ ] http://localhost:3000/board — 任意のカラム間でドラッグできる、ドラッグハンドルあり
- [ ] http://localhost:3000/milestones — マイルストーン一覧が表示される
- [ ] http://localhost:3000/analytics — トレンドチャート・Severity棒グラフ・担当者テーブル・マイルストーン進捗が表示される
- [ ] http://localhost:3000/bugs/new — マイルストーンセレクターが動作する
- [ ] サイドバーの折りたたみが動作する
- [ ] `/analytics` のサイドバーリンクがアクティブ状態になる

---

## 注意事項

1. **recharts は Docker コンテナ内でインストール**する（ホスト側の package.json に反映するためコンテナを再ビルドするか、`docker compose exec frontend npm install recharts` してから package.json + package-lock.json をホスト側にコピーする）
2. **analytics バックエンドの SQL** は既存の `Bug.closed_at` フィールドを使う。`closed_at` は `updateBug` でステータスが `closed` になったときにセットされることを確認する（既存コードを確認）
3. **KanbanBoard.tsx の実際の実装**を必ず読んでから Task 3 の Step 3 を適用する（ファイル内容が想定と異なる場合は合わせて調整する）
