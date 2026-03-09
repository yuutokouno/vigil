# Vigil Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vigil を Linear/Jira ライクなフルダッシュボードに進化させる。アプリシェル、GitHub OAuth 認証、インラインセル編集、カンバンボード、マイルストーン管理を追加。

**Architecture:** 既存の FSD (Feature-Sliced Design) + Repository Pattern を維持しつつ拡張。フロントエンドは TanStack Table / dnd-kit / Framer Motion を追加。バックエンドは users / milestones テーブルと GitHub OAuth を追加。

**Tech Stack:** Next.js 14 / FastAPI / PostgreSQL / TanStack Table / dnd-kit / next-auth (Auth.js v5) / next-themes / Framer Motion / Lucide Icons

**Design Doc:** `docs/plans/2026-03-03-phase2-design.md`

---

## Step 7: アプリケーションシェル + ダークモード

### Task 1: next-themes + lucide-react 導入

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/app/globals.css`

**Step 1: パッケージインストール**

```bash
cd frontend
docker compose exec frontend npm install next-themes
# lucide-react は既に package.json にある
```

**Step 2: globals.css にブランドカラー + ダークモードトークン追加**

`frontend/app/globals.css` の `:root` と `.dark` にブランドカラーを追加:

```css
@layer base {
  :root {
    /* ...existing tokens... */
    --sidebar: 0 0% 98%;
    --sidebar-foreground: 0 0% 3.9%;
    --sidebar-border: 0 0% 89.8%;
    --sidebar-accent: 0 0% 96.1%;
    --sidebar-accent-foreground: 0 0% 9%;
  }
  .dark {
    /* ...existing tokens... */
    --sidebar: 0 0% 5.9%;
    --sidebar-foreground: 0 0% 98%;
    --sidebar-border: 0 0% 14.9%;
    --sidebar-accent: 0 0% 14.9%;
    --sidebar-accent-foreground: 0 0% 98%;
  }
}
```

**Step 3: layout.tsx に ThemeProvider をラップ**

```tsx
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vigil",
  description: "Bug tracking dashboard for archaive",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 4: 動作確認**

```bash
docker compose up -d
# http://localhost:3000 が起動することを確認
```

**Step 5: コミット**

```bash
git add frontend/package.json frontend/app/layout.tsx frontend/app/globals.css
git commit -m "feat: add next-themes and brand color tokens"
```

---

### Task 2: Sidebar コンポーネント

**Files:**
- Create: `frontend/src/widgets/app-shell/ui/Sidebar.tsx`

**Step 1: Sidebar を作成**

Linear 風の左サイドバー。折りたたみ対応。Lucide Icons を使用。

```tsx
// frontend/src/widgets/app-shell/ui/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  Kanban,
  Milestone,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/src/shared/ui";

const NAV_ITEMS = [
  { href: "/", label: "Issues", icon: Bug },
  { href: "/board", label: "Board", icon: Kanban },
  { href: "/milestones", label: "Milestones", icon: Milestone },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        isCollapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <span className="text-lg font-bold text-sidebar-foreground">
            VIGIL
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto h-8 w-8 text-sidebar-foreground", isCollapsed && "mx-auto ml-0")}
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
      <nav className="flex-1 space-y-1 p-2">
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
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 2: コミット**

```bash
git add frontend/src/widgets/app-shell/ui/Sidebar.tsx
git commit -m "feat: add Sidebar component with navigation"
```

---

### Task 3: Header コンポーネント

**Files:**
- Create: `frontend/src/widgets/app-shell/ui/Header.tsx`

**Step 1: Header を作成**

テーマ切り替えボタン + 新規バグ作成ボタン。

```tsx
// frontend/src/widgets/app-shell/ui/Header.tsx
"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { Moon, Sun, Plus } from "lucide-react";
import { Button } from "@/src/shared/ui";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button size="sm" asChild>
          <Link href="/bugs/new">
            <Plus className="mr-1 h-4 w-4" />
            新規バグ
          </Link>
        </Button>
      </div>
    </header>
  );
}
```

**Step 2: コミット**

```bash
git add frontend/src/widgets/app-shell/ui/Header.tsx
git commit -m "feat: add Header component with theme toggle"
```

---

### Task 4: AppShell レイアウト + tailwind sidebar colors

**Files:**
- Create: `frontend/src/widgets/app-shell/ui/AppShell.tsx`
- Modify: `frontend/tailwind.config.ts` — sidebar カラートークン追加
- Modify: `frontend/app/layout.tsx` — AppShell でラップ
- Modify: `frontend/app/page.tsx` — 不要なラッパー削除
- Modify: `frontend/src/pages/dashboard/ui/DashboardPage.tsx` — 外側の padding/max-width 削除

**Step 1: tailwind.config.ts に sidebar カラーを追加**

`theme.extend.colors` に追加:

```ts
sidebar: {
  DEFAULT: 'hsl(var(--sidebar))',
  foreground: 'hsl(var(--sidebar-foreground))',
  border: 'hsl(var(--sidebar-border))',
  accent: 'hsl(var(--sidebar-accent))',
  'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
},
```

**Step 2: AppShell を作成**

```tsx
// frontend/src/widgets/app-shell/ui/AppShell.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

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
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

**Step 3: layout.tsx に AppShell を統合**

```tsx
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/src/widgets/app-shell/ui/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vigil",
  description: "Bug tracking dashboard for archaive",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 4: DashboardPage から外側の `mx-auto max-w-7xl p-6` を削除**

AppShell の `<main>` が `p-6` を提供するので、各ページコンポーネントから外側のラッパーを削除:

```tsx
// DashboardPage.tsx
// Before: <div className="mx-auto max-w-7xl space-y-6 p-6">
// After:  <div className="space-y-6">
```

同様に `CreateBugPage.tsx`, `BugDetailPage.tsx` も修正。

**Step 5: 動作確認**

```bash
docker compose up -d
# http://localhost:3000 でサイドバー + ヘッダーが表示されることを確認
# ダークモード切り替えが動作することを確認
```

**Step 6: コミット**

```bash
git add -A
git commit -m "feat: add AppShell layout with sidebar, header, and dark mode"
```

---

### Task 5: ビュー切り替えタブ

**Files:**
- Create: `frontend/src/features/view-toggle/ui/ViewToggle.tsx`
- Modify: `frontend/src/pages/dashboard/ui/DashboardPage.tsx`
- Create: `frontend/app/board/page.tsx`

**Step 1: ViewToggle コンポーネント作成**

```tsx
// frontend/src/features/view-toggle/ui/ViewToggle.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { List, Kanban } from "lucide-react";
import { Button } from "@/src/shared/ui";
import { cn } from "@/lib/utils";

const VIEWS = [
  { path: "/", label: "テーブル", icon: List },
  { path: "/board", label: "ボード", icon: Kanban },
] as const;

export function ViewToggle() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex rounded-md border">
      {VIEWS.map((view) => {
        const isActive =
          view.path === "/"
            ? pathname === "/" || pathname.startsWith("/bugs")
            : pathname === view.path;

        return (
          <Button
            key={view.path}
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 rounded-none first:rounded-l-md last:rounded-r-md",
              isActive && "bg-accent"
            )}
            onClick={() => router.push(view.path)}
          >
            <view.icon className="h-4 w-4" />
            {view.label}
          </Button>
        );
      })}
    </div>
  );
}
```

**Step 2: DashboardPage にビュー切り替えを追加**

DashboardPage のヘッダーに ViewToggle を配置。「+ バグを報告」ボタンは Header に移動済みなので削除。

**Step 3: Board ページのプレースホルダー作成**

```tsx
// frontend/app/board/page.tsx
"use client";

import { ViewToggle } from "@/src/features/view-toggle/ui/ViewToggle";

export default function BoardRoute() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <ViewToggle />
      </div>
      <p className="text-muted-foreground">カンバンボードは Step 10 で実装します</p>
    </div>
  );
}
```

**Step 4: コミット**

```bash
git add -A
git commit -m "feat: add view toggle (table/board) to dashboard"
```

---

## Step 8: ユーザー認証（GitHub OAuth）

### Task 6: Backend — users テーブル + マイグレーション

**Files:**
- Modify: `backend/app/domain/models.py` — User モデル追加
- Create: `backend/alembic/versions/xxxx_add_users_table.py` (autogenerate)

**Step 1: User モデルを追加**

```python
# backend/app/domain/models.py に追加
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    github_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(300))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

**Step 2: マイグレーション生成**

```bash
docker compose exec backend alembic revision --autogenerate -m "add_users_table"
docker compose exec backend alembic upgrade head
```

**Step 3: コミット**

```bash
git add backend/app/domain/models.py backend/alembic/versions/
git commit -m "feat: add users table and migration"
```

---

### Task 7: Backend — User スキーマ + リポジトリ

**Files:**
- Modify: `backend/app/domain/schemas.py` — UserResponse 追加
- Create: `backend/app/repository/user_repo.py`

**Step 1: User スキーマ追加**

```python
# backend/app/domain/schemas.py に追加
class UserResponse(BaseModel):
    id: str
    github_id: str
    name: str
    email: str | None
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

**Step 2: UserRepository 作成**

```python
# backend/app/repository/user_repo.py
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import User
from app.domain.schemas import UserResponse


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def upsert_by_github_id(
        self, github_id: str, name: str, email: str | None, avatar_url: str | None
    ) -> UserResponse:
        result = await self._session.execute(
            select(User).where(User.github_id == github_id)
        )
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                github_id=github_id,
                name=name,
                email=email,
                avatar_url=avatar_url,
            )
            self._session.add(user)
        else:
            user.name = name
            user.email = email
            user.avatar_url = avatar_url

        await self._session.commit()
        await self._session.refresh(user)
        return self._to_response(user)

    async def get_by_id(self, user_id: str) -> UserResponse | None:
        import uuid
        user = await self._session.get(User, uuid.UUID(user_id))
        if user is None:
            return None
        return self._to_response(user)

    async def list_users(self) -> list[UserResponse]:
        result = await self._session.execute(select(User).order_by(User.name))
        return [self._to_response(u) for u in result.scalars().all()]

    @staticmethod
    def _to_response(user: User) -> UserResponse:
        return UserResponse(
            id=str(user.id),
            github_id=user.github_id,
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
```

**Step 3: コミット**

```bash
git add backend/app/domain/schemas.py backend/app/repository/user_repo.py
git commit -m "feat: add User schema and repository"
```

---

### Task 8: Backend — GitHub OAuth + JWT

**Files:**
- Modify: `backend/requirements.txt` — httpx, python-jose 追加
- Modify: `backend/app/config.py` — GitHub OAuth 設定追加
- Create: `backend/app/presentation/auth.py`
- Modify: `backend/app/main.py` — auth router 追加

**Step 1: 依存パッケージ追加**

```
# backend/requirements.txt に追加
httpx==0.28.1
python-jose[cryptography]==3.3.0
```

**Step 2: config.py に OAuth 設定追加**

```python
# backend/app/config.py の Settings に追加
github_client_id: str = ""
github_client_secret: str = ""
jwt_secret: str = "vigil-dev-secret-change-in-production"
jwt_algorithm: str = "HS256"
jwt_expire_minutes: int = 1440  # 24 hours
frontend_url: str = "http://localhost:3000"
```

**Step 3: auth.py エンドポイント作成**

```python
# backend/app/presentation/auth.py
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.domain.schemas import UserResponse
from app.repository.user_repo import UserRepository

router = APIRouter(prefix="/api/auth", tags=["auth"])

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


@router.get("/github")
async def github_login():
    return RedirectResponse(
        f"{GITHUB_AUTHORIZE_URL}?client_id={settings.github_client_id}&scope=user:email"
    )


@router.get("/github/callback")
async def github_callback(
    code: str,
    session: AsyncSession = Depends(get_session),
):
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            json={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_response.json()

        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")

        # Get user info
        user_response = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        github_user = user_response.json()

    # Upsert user
    repo = UserRepository(session)
    user = await repo.upsert_by_github_id(
        github_id=str(github_user["id"]),
        name=github_user.get("name") or github_user["login"],
        email=github_user.get("email"),
        avatar_url=github_user.get("avatar_url"),
    )

    # Create JWT
    token = _create_token(user.id)

    # Redirect to frontend with token
    response = RedirectResponse(f"{settings.frontend_url}?token={token}")
    return response


@router.get("/me", response_model=UserResponse)
async def get_me(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    user_id = _get_current_user_id(request)
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def _get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Step 4: main.py に auth router 追加**

```python
from app.presentation.auth import router as auth_router
app.include_router(auth_router)
```

**Step 5: docker-compose.yml に環境変数追加**

backend サービスの environment に追加:
```yaml
GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
JWT_SECRET: ${JWT_SECRET:-vigil-dev-secret}
```

**Step 6: コミット**

```bash
git add -A
git commit -m "feat: add GitHub OAuth authentication endpoints"
```

---

### Task 9: Backend — Users API

**Files:**
- Create: `backend/app/presentation/users.py`
- Modify: `backend/app/main.py`

**Step 1: Users エンドポイント作成**

```python
# backend/app/presentation/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.domain.schemas import UserResponse
from app.repository.user_repo import UserRepository

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users(session: AsyncSession = Depends(get_session)):
    repo = UserRepository(session)
    return await repo.list_users()
```

**Step 2: main.py に登録**

```python
from app.presentation.users import router as users_router
app.include_router(users_router)
```

**Step 3: コミット**

```bash
git add backend/app/presentation/users.py backend/app/main.py
git commit -m "feat: add users API endpoint"
```

---

### Task 10: Frontend — 認証フロー

**Files:**
- Create: `frontend/src/features/auth/model/use-auth.ts`
- Create: `frontend/src/features/auth/ui/LoginButton.tsx`
- Create: `frontend/src/entities/user/model/types.ts`
- Create: `frontend/src/entities/user/api/user-api.ts`
- Create: `frontend/src/entities/user/ui/UserAvatar.tsx`
- Modify: `frontend/src/shared/api/client.ts` — Authorization ヘッダー追加
- Modify: `frontend/src/widgets/app-shell/ui/Header.tsx` — ユーザー情報表示
- Create: `frontend/app/login/page.tsx`

**Step 1: User 型定義**

```typescript
// frontend/src/entities/user/model/types.ts
export type User = {
  id: string;
  github_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};
```

**Step 2: user-api.ts**

```typescript
// frontend/src/entities/user/api/user-api.ts
import { apiClient } from "@/src/shared/api/client";
import type { User } from "@/src/entities/user/model/types";

export async function getMe(): Promise<User> {
  return apiClient<User>("/api/auth/me");
}

export async function listUsers(): Promise<User[]> {
  return apiClient<User[]>("/api/users");
}
```

**Step 3: use-auth hook**

```typescript
// frontend/src/features/auth/model/use-auth.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@/src/entities/user/model/types";
import { getMe } from "@/src/entities/user/api/user-api";

const TOKEN_KEY = "vigil_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Remove token from URL
      router.replace("/");
    }
  }, [searchParams, router]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    window.location.href = `${apiUrl}/api/auth/github`;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, isLoading, login, logout };
}
```

**Step 4: apiClient に Authorization ヘッダーを追加**

`frontend/src/shared/api/client.ts` の `apiClient` 関数で、リクエスト時に `getToken()` からトークンを取得して `Authorization: Bearer <token>` ヘッダーを付与。

```typescript
// headers 生成部分を修正
import { getToken } from "@/src/features/auth/model/use-auth";

// apiClient 内の headers 部分:
const token = getToken();
if (token) {
  headers["Authorization"] = `Bearer ${token}`;
}
```

**注意:** FSD のレイヤー依存ルール的に shared → features への依存は違反。対策として `getToken` を `shared/lib/auth-token.ts` に移動する。

**Step 5: UserAvatar コンポーネント**

```tsx
// frontend/src/entities/user/ui/UserAvatar.tsx
"use client";

import type { User } from "@/src/entities/user/model/types";

type UserAvatarProps = {
  user: User;
  size?: number;
};

export function UserAvatar({ user, size = 32 }: UserAvatarProps) {
  return (
    <img
      src={user.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
      alt={user.name}
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}
```

**Step 6: Header にユーザー情報を表示**

Header に `useAuth` を組み込み、ログイン済みならアバター + ドロップダウン、未ログインなら Login ボタンを表示。

**Step 7: Login ページ**

```tsx
// frontend/app/login/page.tsx
"use client";

import { useAuth } from "@/src/features/auth/model/use-auth";
import { Button } from "@/src/shared/ui";
import { Github } from "lucide-react";

export default function LoginRoute() {
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">VIGIL</h1>
        <p className="text-muted-foreground">
          archaive バグ管理ダッシュボード
        </p>
        <Button onClick={login} size="lg">
          <Github className="mr-2 h-5 w-5" />
          GitHub でログイン
        </Button>
      </div>
    </div>
  );
}
```

**Step 8: コミット**

```bash
git add -A
git commit -m "feat: add GitHub OAuth frontend flow with JWT"
```

---

## Step 9: テーブルのインラインセル編集

### Task 11: TanStack Table 導入

**Files:**
- Modify: `frontend/package.json`

**Step 1: インストール**

```bash
docker compose exec frontend npm install @tanstack/react-table
```

**Step 2: コミット**

```bash
git add frontend/package.json
git commit -m "chore: add @tanstack/react-table dependency"
```

---

### Task 12: EditableCell コンポーネント群

**Files:**
- Create: `frontend/src/features/inline-edit/ui/EditableTextCell.tsx`
- Create: `frontend/src/features/inline-edit/ui/EditableSelectCell.tsx`
- Create: `frontend/src/features/inline-edit/model/use-inline-edit.ts`

**Step 1: use-inline-edit hook**

楽観的 UI パターン: ローカル state を即座に更新 → API 呼び出し → 失敗時リバート。

```typescript
// frontend/src/features/inline-edit/model/use-inline-edit.ts
"use client";

import { useState } from "react";
import { updateBug } from "@/src/entities/bug/api/bug-api";
import type { Bug, BugUpdate } from "@/src/entities/bug/model/types";

export function useInlineEdit(
  bug: Bug,
  onUpdated: (bug: Bug) => void,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const save = async (field: keyof BugUpdate, value: string | null) => {
    // Skip if value hasn't changed
    const currentValue = bug[field as keyof Bug];
    if (currentValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    // Optimistic update
    const optimisticBug = { ...bug, [field]: value };
    onUpdated(optimisticBug);

    try {
      const updated = await updateBug(bug.id, { [field]: value } as BugUpdate);
      onUpdated(updated);
    } catch {
      // Revert on error
      onUpdated(bug);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return { isEditing, setIsEditing, isSaving, save };
}
```

**Step 2: EditableTextCell**

```tsx
// frontend/src/features/inline-edit/ui/EditableTextCell.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/src/shared/ui";
import type { Bug, BugUpdate } from "@/src/entities/bug/model/types";

type EditableTextCellProps = {
  value: string;
  field: keyof BugUpdate;
  bug: Bug;
  onSave: (field: keyof BugUpdate, value: string | null) => Promise<void>;
};

export function EditableTextCell({ value, field, bug, onSave }: EditableTextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onSave(field, localValue || null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 w-full"
      />
    );
  }

  return (
    <span
      className="cursor-pointer rounded px-1 py-0.5 hover:bg-accent"
      onClick={() => setIsEditing(true)}
    >
      {value || "-"}
    </span>
  );
}
```

**Step 3: EditableSelectCell**

```tsx
// frontend/src/features/inline-edit/ui/EditableSelectCell.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui";
import type { BugUpdate } from "@/src/entities/bug/model/types";

type EditableSelectCellProps = {
  value: string;
  field: keyof BugUpdate;
  options: { value: string; label: string }[];
  onSave: (field: keyof BugUpdate, value: string | null) => Promise<void>;
};

export function EditableSelectCell({
  value,
  field,
  options,
  onSave,
}: EditableSelectCellProps) {
  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        if (newValue !== value) {
          onSave(field, newValue);
        }
      }}
    >
      <SelectTrigger className="h-8 w-full border-none bg-transparent shadow-none hover:bg-accent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 4: コミット**

```bash
git add frontend/src/features/inline-edit/
git commit -m "feat: add EditableTextCell and EditableSelectCell components"
```

---

### Task 13: BugTable を TanStack Table で再構築

**Files:**
- Modify: `frontend/src/entities/bug/ui/BugTable.tsx` — 完全リライト
- Modify: `frontend/src/widgets/bug-list/ui/BugList.tsx` — onBugUpdated callback 追加

**Step 1: BugTable を TanStack Table ベースに再構築**

`@tanstack/react-table` の `useReactTable` を使用。各カラムに EditableTextCell / EditableSelectCell を組み込む。

- severity: EditableSelectCell (critical/high/medium/low)
- title: EditableTextCell (Link to detail + click-to-edit)
- status: EditableSelectCell (遷移制約付き — VALID_TRANSITIONS を参照)
- priority: EditableSelectCell (P0/P1/P2/P3)
- assigned_to: EditableTextCell
- created_at: 読み取り専用（日付表示）

`table.options.meta.updateData` パターンで親にデータ更新を通知。

**Step 2: BugList に onBugUpdated を追加**

インライン編集後にローカルの `bugs` 配列を更新するコールバックを追加。

**Step 3: 動作確認**

```bash
docker compose up -d
# テーブルのセルをクリックして編集できることを確認
# Escape でキャンセルされることを確認
# 値が API 経由で保存されることを確認
```

**Step 4: コミット**

```bash
git add -A
git commit -m "feat: rebuild BugTable with TanStack Table and inline editing"
```

---

## Step 10: カンバンボード

### Task 14: dnd-kit 導入

**Files:**
- Modify: `frontend/package.json`

**Step 1: インストール**

```bash
docker compose exec frontend npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: コミット**

```bash
git add frontend/package.json
git commit -m "chore: add @dnd-kit dependencies"
```

---

### Task 15: KanbanCard + KanbanColumn

**Files:**
- Create: `frontend/src/features/kanban/ui/KanbanCard.tsx`
- Create: `frontend/src/features/kanban/ui/KanbanColumn.tsx`

**Step 1: KanbanCard**

バグの要約カード。深刻度バッジ + タイトル + 優先度 + 担当者。ドラッグ可能。

```tsx
// frontend/src/features/kanban/ui/KanbanCard.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { SeverityBadge } from "@/src/entities/bug/ui/SeverityBadge";
import type { Bug } from "@/src/entities/bug/model/types";

type KanbanCardProps = {
  bug: Bug;
};

export function KanbanCard({ bug }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bug.id, data: { bug } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border bg-card p-3 shadow-sm hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-2 flex items-center gap-2">
        <SeverityBadge severity={bug.severity} />
        <span className="text-xs text-muted-foreground">{bug.priority}</span>
      </div>
      <Link
        href={`/bugs/${bug.id}`}
        className="text-sm font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {bug.title}
      </Link>
      <div className="mt-2 text-xs text-muted-foreground">
        {bug.assigned_to ?? "未割当"}
      </div>
    </div>
  );
}
```

**Step 2: KanbanColumn**

ステータスごとのカラム。ドロップゾーン。

```tsx
// frontend/src/features/kanban/ui/KanbanColumn.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { STATUS_LABELS, type Bug, type Status } from "@/src/entities/bug/model/types";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";

const STATUS_HEADER_COLORS: Record<Status, string> = {
  open: "border-t-red-500",
  in_progress: "border-t-blue-500",
  in_review: "border-t-yellow-500",
  closed: "border-t-green-500",
};

type KanbanColumnProps = {
  status: Status;
  bugs: Bug[];
  isOver?: boolean;
};

export function KanbanColumn({ status, bugs, isOver }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] flex-col rounded-lg border border-t-4 bg-muted/30 p-3",
        STATUS_HEADER_COLORS[status],
        isOver && "ring-2 ring-primary"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
        <span className="text-xs text-muted-foreground">{bugs.length}</span>
      </div>

      <SortableContext
        items={bugs.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {bugs.map((bug) => (
            <KanbanCard key={bug.id} bug={bug} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
```

**Step 3: コミット**

```bash
git add frontend/src/features/kanban/
git commit -m "feat: add KanbanCard and KanbanColumn components"
```

---

### Task 16: KanbanBoard ウィジェット + D&D ロジック

**Files:**
- Create: `frontend/src/widgets/kanban-board/ui/KanbanBoard.tsx`
- Create: `frontend/src/features/kanban/model/use-kanban-dnd.ts`

**Step 1: use-kanban-dnd hook**

ステータス遷移制約の検証 + 楽観的 UI + API 呼び出し。

```typescript
// frontend/src/features/kanban/model/use-kanban-dnd.ts
"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { updateBug } from "@/src/entities/bug/api/bug-api";
import type { Bug, Status } from "@/src/entities/bug/model/types";

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  open: ["in_progress"],
  in_progress: ["in_review"],
  in_review: ["closed"],
  closed: ["open"],
};

export function useKanbanDnd(
  bugs: Bug[],
  onBugsChange: (bugs: Bug[]) => void,
) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const bugId = active.id as string;
    const newStatus = over.id as Status;

    const bug = bugs.find((b) => b.id === bugId);
    if (!bug || bug.status === newStatus) return;

    // Check transition validity
    const allowed = VALID_TRANSITIONS[bug.status] ?? [];
    if (!allowed.includes(newStatus)) return;

    // Optimistic update
    const updatedBugs = bugs.map((b) =>
      b.id === bugId ? { ...b, status: newStatus } : b
    );
    onBugsChange(updatedBugs);

    try {
      await updateBug(bugId, { status: newStatus });
    } catch {
      // Revert
      onBugsChange(bugs);
    }
  };

  return { handleDragEnd };
}
```

**Step 2: KanbanBoard ウィジェット**

```tsx
// frontend/src/widgets/kanban-board/ui/KanbanBoard.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { listBugs } from "@/src/entities/bug/api/bug-api";
import type { Bug, BugListParams, Status } from "@/src/entities/bug/model/types";
import { STATUS } from "@/src/entities/bug/model/types";
import { KanbanColumn } from "@/src/features/kanban/ui/KanbanColumn";
import { useKanbanDnd } from "@/src/features/kanban/model/use-kanban-dnd";

const STATUS_ORDER: Status[] = ["open", "in_progress", "in_review", "closed"];

export function KanbanBoard() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBugs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listBugs({ limit: 100 });
      setBugs(response.items);
    } catch {
      setBugs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const { handleDragEnd } = useKanbanDnd(bugs, setBugs);

  const bugsByStatus = (status: Status) =>
    bugs.filter((b) => b.status === status);

  if (isLoading) {
    return <p className="text-center text-muted-foreground">読み込み中...</p>;
  }

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            bugs={bugsByStatus(status)}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

**Step 3: Board ページにカンバンボードを配置**

```tsx
// frontend/app/board/page.tsx
"use client";

import { ViewToggle } from "@/src/features/view-toggle/ui/ViewToggle";
import { KanbanBoard } from "@/src/widgets/kanban-board/ui/KanbanBoard";

export default function BoardRoute() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <ViewToggle />
      </div>
      <KanbanBoard />
    </div>
  );
}
```

**Step 4: 動作確認**

```bash
docker compose up -d
# /board でカンバンボードが表示されることを確認
# カードをドラッグして有効な遷移先にドロップできることを確認
# 無効な遷移先にはドロップできないことを確認
```

**Step 5: コミット**

```bash
git add -A
git commit -m "feat: add Kanban board with drag-and-drop status transitions"
```

---

## Step 11: マイルストーン管理

### Task 17: Backend — milestones テーブル + bugs.milestone_id

**Files:**
- Modify: `backend/app/domain/models.py` — Milestone モデル + Bug に milestone_id 追加
- Create: `backend/alembic/versions/xxxx_add_milestones.py` (autogenerate)
- Modify: `backend/app/domain/schemas.py` — Milestone スキーマ

**Step 1: Milestone モデル追加 + Bug に milestone_id FK 追加**

```python
# backend/app/domain/models.py
class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

# Bug モデルに追加:
# milestone_id: Mapped[uuid.UUID | None] = mapped_column(
#     UUID(as_uuid=True), ForeignKey("milestones.id"), nullable=True
# )
```

**Step 2: Milestone スキーマ追加**

```python
# backend/app/domain/schemas.py に追加
class MilestoneStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MilestoneCreate(BaseModel):
    title: str
    description: str | None = None
    due_date: datetime | None = None

class MilestoneUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: datetime | None = None
    status: MilestoneStatus | None = None

class MilestoneResponse(BaseModel):
    id: str
    title: str
    description: str | None
    due_date: datetime | None
    status: MilestoneStatus
    created_at: datetime
    updated_at: datetime
    # Progress (filled by usecase)
    total_bugs: int = 0
    closed_bugs: int = 0

    model_config = {"from_attributes": True}
```

**Step 3: マイグレーション**

```bash
docker compose exec backend alembic revision --autogenerate -m "add_milestones_and_bug_milestone_id"
docker compose exec backend alembic upgrade head
```

**Step 4: コミット**

```bash
git add -A
git commit -m "feat: add milestones table and bug milestone_id"
```

---

### Task 18: Backend — Milestone Repository + Usecase + API

**Files:**
- Create: `backend/app/repository/milestone_repo.py`
- Create: `backend/app/usecase/milestone_usecase.py`
- Create: `backend/app/presentation/milestones.py`
- Modify: `backend/app/main.py`

**Step 1: MilestoneRepository**

PostgreSQL 実装。CRUD + 紐づくバグの件数計算。

**Step 2: MilestoneUsecase**

ステータスが completed に変更される際、紐づくバグが全て closed であることは強制しない（手動完了を許容）。

**Step 3: Milestones API エンドポイント**

```
POST   /api/milestones
GET    /api/milestones
GET    /api/milestones/{id}
PATCH  /api/milestones/{id}
DELETE /api/milestones/{id}
```

**Step 4: コミット**

```bash
git add -A
git commit -m "feat: add milestone CRUD API"
```

---

### Task 19: Frontend — マイルストーン UI

**Files:**
- Create: `frontend/src/entities/milestone/model/types.ts`
- Create: `frontend/src/entities/milestone/api/milestone-api.ts`
- Create: `frontend/src/entities/milestone/ui/MilestoneCard.tsx`
- Create: `frontend/src/features/milestone/ui/MilestoneForm.tsx`
- Create: `frontend/src/features/milestone/model/use-create-milestone.ts`
- Create: `frontend/src/widgets/milestone-list/ui/MilestoneList.tsx`
- Create: `frontend/src/pages/milestones/ui/MilestonesPage.tsx`
- Create: `frontend/app/milestones/page.tsx`

**Step 1: Milestone 型定義 + API**

```typescript
// frontend/src/entities/milestone/model/types.ts
export type MilestoneStatus = "active" | "completed" | "cancelled";

export type Milestone = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: MilestoneStatus;
  created_at: string;
  updated_at: string;
  total_bugs: number;
  closed_bugs: number;
};

export type MilestoneCreate = {
  title: string;
  description?: string | null;
  due_date?: string | null;
};
```

**Step 2: MilestoneCard**

プログレスバー付きカード。`closed_bugs / total_bugs` で進捗表示。

**Step 3: Framer Motion でマイルストーン完了アニメーション**

```bash
docker compose exec frontend npm install framer-motion
```

100% 完了時にチェックマークがバウンスアニメーション:

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

// milestone.closed_bugs === milestone.total_bugs && milestone.total_bugs > 0
<AnimatePresence>
  {isComplete && (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      <Check className="h-5 w-5 text-green-500" />
    </motion.div>
  )}
</AnimatePresence>
```

**Step 4: MilestoneForm + use-create-milestone**

タイトル + 説明 + 期限日のシンプルなフォーム。

**Step 5: MilestoneList ウィジェット + MilestonesPage**

マイルストーン一覧 + 新規作成ボタン。

**Step 6: 動作確認**

```bash
docker compose up -d
# /milestones でマイルストーン一覧が表示されることを確認
# 新規マイルストーン作成ができることを確認
# プログレスバーが正しく動作することを確認
```

**Step 7: コミット**

```bash
git add -A
git commit -m "feat: add milestone management UI with progress tracking"
```

---

### Task 20: バグとマイルストーンの紐づけ

**Files:**
- Modify: `frontend/src/entities/bug/model/types.ts` — Bug 型に milestone_id 追加
- Modify: `frontend/src/features/create-bug/ui/BugForm.tsx` — マイルストーン選択追加
- Modify: `backend/app/domain/schemas.py` — BugCreate/BugUpdate に milestone_id 追加

**Step 1: バグ作成/編集フォームにマイルストーン選択を追加**

**Step 2: コミット**

```bash
git add -A
git commit -m "feat: link bugs to milestones"
```

---

## Step 12: 統合テスト + UI/UX ポリッシュ

### Task 21: 全機能の動作確認

**Step 1: Docker 環境リビルド**

```bash
docker compose down
docker compose up --build -d
docker compose exec backend alembic upgrade head
```

**Step 2: 確認項目チェックリスト**

- [ ] サイドバーのナビゲーションが動作する
- [ ] ダークモード切り替えが動作する
- [ ] GitHub OAuth ログイン/ログアウトが動作する
- [ ] テーブルのインラインセル編集（全5カラム）が動作する
- [ ] カンバンボードの D&D が動作する（遷移制約付き）
- [ ] マイルストーンの CRUD が動作する
- [ ] マイルストーンのプログレスバーが正しい
- [ ] バグとマイルストーンの紐づけが動作する
- [ ] ビュー切り替え（テーブル ↔ ボード）が動作する
- [ ] レスポンシブ（320px〜1440px）
- [ ] Lighthouse アクセシビリティスコア

### Task 22: コミット + GitHub Issue クローズ

**Step 1: 最終コミット**

```bash
git add -A
git commit -m "feat: Phase 2 complete - app shell, auth, inline edit, kanban, milestones"
```

**Step 2: GitHub Issues 作成 + クローズ**

Phase 2 の各 Step に対応する Issue を作成し、完了後にクローズ。

---

## 依存関係図

```
Task 1 (next-themes)
  → Task 2 (Sidebar)
  → Task 3 (Header)
  → Task 4 (AppShell) → Task 5 (ViewToggle)

Task 6 (users table)
  → Task 7 (User schema/repo)
  → Task 8 (GitHub OAuth)
  → Task 9 (Users API)
  → Task 10 (Frontend auth)

Task 11 (TanStack Table)
  → Task 12 (EditableCells)
  → Task 13 (BugTable rebuild)

Task 14 (dnd-kit)
  → Task 15 (KanbanCard/Column)
  → Task 16 (KanbanBoard)

Task 17 (milestones table)
  → Task 18 (Milestone API)
  → Task 19 (Milestone UI)
  → Task 20 (Bug-Milestone link)

Task 21 (Integration test) — depends on all above
Task 22 (Final commit)
```
