# Vigil — バグ管理ダッシュボード 設計書

## 概要

archaive（製造業向け図面管理サービス）のバグを一元管理するダッシュボード。
現状、Slack・Notion・HubSpotにバグ報告が散在している課題を解決する。

**Phase 1（今回作るもの）:**
- バグ報告フォーム（手動登録）
- バグ一覧ダッシュボード（フィルター・ソート・検索）
- ステータス管理（未対応 → 対応中 → 検証待ち → クローズ）

**将来の拡張（今は作らない）:**
- Slack Bot 連携（🐛リアクションで自動取り込み）
- Notion API 連携（保存先をNotionに差し替え）
- HubSpot 連携（顧客バグ報告の取り込み）
- GitHub 連携（Issue自動生成、PRマージでステータス更新）
- AI分類（バグカテゴリ・深刻度の自動判定）

---

## 技術スタック

### Backend
- **Python 3.12**
- **FastAPI** (ASGI)
- **SQLAlchemy 2.0** (asyncpg)
- **Alembic** (マイグレーション)
- **Pydantic v2** (バリデーション)
- **PostgreSQL** (Railway)

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (UIコンポーネント)

### インフラ
- **Vercel** (フロントエンド)
- **Railway** (バックエンド + PostgreSQL)

---

## ディレクトリ構成

```
vigil/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPIアプリ初期化、CORSなど
│   │   ├── config.py               # 環境変数管理
│   │   ├── database.py             # DB接続設定
│   │   │
│   │   ├── domain/
│   │   │   ├── models.py           # SQLAlchemy モデル
│   │   │   └── schemas.py          # Pydantic スキーマ
│   │   │
│   │   ├── repository/
│   │   │   ├── base.py             # ABCリポジトリ（依存の逆転）
│   │   │   ├── postgres.py         # PostgreSQL 実装
│   │   │   └── notion.py           # （将来）Notion API 実装
│   │   │
│   │   ├── usecase/
│   │   │   └── bug_usecase.py      # ビジネスロジック
│   │   │
│   │   └── presentation/
│   │       └── bugs.py             # APIエンドポイント（FastAPI Router）
│   │
│   ├── alembic/                    # マイグレーション
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── app/                            # Next.js App Router（ルーティングのみ）
│   │   ├── layout.tsx                  #   ルートレイアウト
│   │   ├── page.tsx                    #   → pages/dashboard を呼ぶだけ
│   │   └── bugs/
│   │       ├── new/
│   │       │   └── page.tsx            #   → pages/create-bug を呼ぶだけ
│   │       └── [id]/
│   │           └── page.tsx            #   → pages/bug-detail を呼ぶだけ
│   │
│   ├── src/
│   │   ├── pages/                      # ページ構成（widgets を組み合わせて1画面を作る）
│   │   │   ├── dashboard/
│   │   │   │   └── ui/
│   │   │   │       └── DashboardPage.tsx   # StatsCards + BugList + FilterBar を配置
│   │   │   ├── create-bug/
│   │   │   │   └── ui/
│   │   │   │       └── CreateBugPage.tsx   # BugForm を配置
│   │   │   └── bug-detail/
│   │   │       └── ui/
│   │   │           └── BugDetailPage.tsx   # BugDetail + StatusSelect を配置
│   │   │
│   │   ├── widgets/                    # 複合UIブロック（features + entities の組み合わせ）
│   │   │   ├── bug-list/
│   │   │   │   └── ui/
│   │   │   │       └── BugList.tsx     #   FilterBar + BugTable の統合
│   │   │   ├── stats-cards/
│   │   │   │   └── ui/
│   │   │   │       └── StatsCards.tsx  #   ステータス別・深刻度別の集計カード
│   │   │   └── bug-detail/
│   │   │       └── ui/
│   │   │           └── BugDetail.tsx   #   バグ情報表示 + ステータス変更
│   │   │
│   │   ├── features/                   # ユーザー操作（アクション単位）
│   │   │   ├── create-bug/
│   │   │   │   ├── ui/
│   │   │   │   │   └── BugForm.tsx     #   バグ報告フォーム
│   │   │   │   └── model/
│   │   │   │       └── use-create-bug.ts  # フォーム送信ロジック
│   │   │   ├── filter-bugs/
│   │   │   │   ├── ui/
│   │   │   │   │   └── FilterBar.tsx   #   フィルター・検索バー
│   │   │   │   └── model/
│   │   │   │       └── use-filters.ts  #   フィルター状態管理
│   │   │   └── update-status/
│   │   │       ├── ui/
│   │   │       │   └── StatusSelect.tsx  # ステータス変更UI
│   │   │       └── model/
│   │   │           └── use-update-status.ts
│   │   │
│   │   ├── entities/                   # ビジネスエンティティ（Bug）
│   │   │   └── bug/
│   │   │       ├── ui/
│   │   │       │   ├── BugCard.tsx     #   カード表示
│   │   │       │   ├── BugTable.tsx    #   テーブル行
│   │   │       │   ├── StatusBadge.tsx #   ステータスバッジ
│   │   │       │   └── SeverityBadge.tsx  # 深刻度バッジ
│   │   │       ├── model/
│   │   │       │   └── types.ts        #   Bug型定義
│   │   │       └── api/
│   │   │           └── bug-api.ts      #   Bug関連API呼び出し
│   │   │
│   │   └── shared/                     # 再利用可能なユーティリティ
│   │       ├── ui/
│   │       │   └── index.ts            #   共通UIコンポーネント（shadcn/ui re-export）
│   │       ├── api/
│   │       │   └── client.ts           #   fetchラッパー（ベースURL設定等）
│   │       └── lib/
│   │           └── utils.ts            #   ユーティリティ関数
│   │
│   ├── tailwind.config.ts
│   ├── package.json
│   └── .env.local.example
│
└── README.md
```

---

## データモデル

### bugs テーブル

```sql
CREATE TABLE bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- 再現情報
    steps_to_reproduce TEXT,          -- 再現手順
    expected_behavior TEXT,           -- 期待する挙動
    actual_behavior TEXT,             -- 実際の挙動
    environment VARCHAR(100),         -- ブラウザ・OS等

    -- 分類
    status VARCHAR(20) NOT NULL DEFAULT 'open',
        -- open | in_progress | in_review | closed
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        -- critical | high | medium | low
    priority VARCHAR(10) NOT NULL DEFAULT 'P2',
        -- P0 | P1 | P2 | P3
    category VARCHAR(30),
        -- ui | api | type_error | auth | data | performance | other

    -- 担当
    reported_by VARCHAR(100),         -- 報告者名
    assigned_to VARCHAR(100),         -- 担当者名
    source VARCHAR(20) DEFAULT 'manual',
        -- manual | slack | hubspot | test

    -- 外部連携（将来用）
    slack_message_url VARCHAR(500),
    github_issue_url VARCHAR(500),
    notion_page_id VARCHAR(100),

    -- スプリント管理
    sprint VARCHAR(50),

    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_bugs_status ON bugs(status);
CREATE INDEX idx_bugs_severity ON bugs(severity);
CREATE INDEX idx_bugs_created_at ON bugs(created_at);
```

---

## API エンドポイント

### バグ CRUD

```
POST   /api/bugs              バグを作成
GET    /api/bugs              バグ一覧（フィルター・ページング対応）
GET    /api/bugs/{id}         バグ詳細
PATCH  /api/bugs/{id}         バグ更新（ステータス変更等）
DELETE /api/bugs/{id}         バグ削除
```

### 一覧のクエリパラメータ

```
GET /api/bugs?status=open&severity=high&category=api&sort=created_at&order=desc&page=1&limit=20
```

### 集計（ダッシュボード用）

```
GET /api/bugs/stats           ステータス別・深刻度別の件数
```

#### レスポンス例

```json
{
  "total": 42,
  "by_status": {
    "open": 15,
    "in_progress": 10,
    "in_review": 7,
    "closed": 10
  },
  "by_severity": {
    "critical": 2,
    "high": 8,
    "medium": 20,
    "low": 12
  },
  "by_category": {
    "ui": 12,
    "api": 10,
    "type_error": 8,
    "auth": 3,
    "data": 5,
    "other": 4
  }
}
```

---

## リポジトリパターン（依存の逆転）

### base.py — 抽象リポジトリ

```python
from abc import ABC, abstractmethod
from app.domain.schemas import BugCreate, BugUpdate, BugResponse, BugListParams

class BugRepository(ABC):
    @abstractmethod
    async def create(self, bug: BugCreate) -> BugResponse: ...

    @abstractmethod
    async def get_by_id(self, bug_id: str) -> BugResponse | None: ...

    @abstractmethod
    async def list_bugs(self, params: BugListParams) -> list[BugResponse]: ...

    @abstractmethod
    async def update(self, bug_id: str, bug: BugUpdate) -> BugResponse | None: ...

    @abstractmethod
    async def delete(self, bug_id: str) -> bool: ...

    @abstractmethod
    async def get_stats(self) -> dict: ...
```

### postgres.py — PostgreSQL 実装

BugRepository を継承して SQLAlchemy で実装する。

### notion.py — （将来）Notion 実装

同じ BugRepository を継承して Notion API で実装する。
差し替えは DI で行う。

---

## Pydantic スキーマ

```python
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class Status(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    CLOSED = "closed"

class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Priority(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"

class Category(str, Enum):
    UI = "ui"
    API = "api"
    TYPE_ERROR = "type_error"
    AUTH = "auth"
    DATA = "data"
    PERFORMANCE = "performance"
    OTHER = "other"

class Source(str, Enum):
    MANUAL = "manual"
    SLACK = "slack"
    HUBSPOT = "hubspot"
    TEST = "test"

class BugCreate(BaseModel):
    title: str
    description: str | None = None
    steps_to_reproduce: str | None = None
    expected_behavior: str | None = None
    actual_behavior: str | None = None
    environment: str | None = None
    severity: Severity = Severity.MEDIUM
    priority: Priority = Priority.P2
    category: Category | None = None
    reported_by: str | None = None
    assigned_to: str | None = None
    source: Source = Source.MANUAL
    sprint: str | None = None

class BugUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: Status | None = None
    severity: Severity | None = None
    priority: Priority | None = None
    category: Category | None = None
    assigned_to: str | None = None
    sprint: str | None = None

class BugResponse(BaseModel):
    id: str
    title: str
    description: str | None
    steps_to_reproduce: str | None
    expected_behavior: str | None
    actual_behavior: str | None
    environment: str | None
    status: Status
    severity: Severity
    priority: Priority
    category: Category | None
    reported_by: str | None
    assigned_to: str | None
    source: Source
    sprint: str | None
    slack_message_url: str | None
    github_issue_url: str | None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None
```

---

## フロントエンド画面

### 1. ダッシュボード（ / ）

```
┌─────────────────────────────────────────────────┐
│  VIGIL  🔍 バグ検索...           [+ バグを報告]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │  15  │ │  10  │ │   7  │ │  10  │            │
│  │ 未対応│ │対応中│ │検証待│ │ 完了 │            │
│  └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                  │
│  フィルター: [ステータス▼] [深刻度▼] [カテゴリ▼]  │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🔴 Critical  TIFファイルが開けない    未対応 │ │
│  │ 🟡 Medium    ボタンのレイアウト崩れ   対応中 │ │
│  │ 🟢 Low       ログイン画面のtypo      検証待 │ │
│  │ ...                                         │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2. バグ報告フォーム（ /bugs/new ）

```
┌─────────────────────────────────────────────────┐
│  バグを報告する                                   │
│                                                  │
│  タイトル *                                       │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  説明                                            │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  再現手順        期待する挙動      実際の挙動     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │          │   │          │   │          │     │
│  └──────────┘   └──────────┘   └──────────┘     │
│                                                  │
│  深刻度          優先度           カテゴリ        │
│  [Medium ▼]     [P2 ▼]         [選択... ▼]     │
│                                                  │
│  報告者          担当者           環境            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │          │   │          │   │          │     │
│  └──────────┘   └──────────┘   └──────────┘     │
│                                                  │
│                          [キャンセル] [報告する]   │
└─────────────────────────────────────────────────┘
```

### 3. バグ詳細（ /bugs/[id] ）

ステータス変更ボタン、編集機能、コメント（将来）。

---

## Claude Code への実装指示

### Step 0: Git 初期化
1. プロジェクトルートで `git init`
2. `gh repo create vigil --private --source=. --remote=origin`
3. `.gitignore` を作成（Python + Node.js + 環境変数）
4. 初回コミット `git commit -m "init: Vigil project setup"`
5. 以降、各 Step 完了ごとにコミットする

#### .gitignore
```
# Python
__pycache__/
*.pyc
.venv/
*.egg-info/

# Node
node_modules/
.next/

# 環境変数
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

### Step 1: Backend セットアップ
1. `backend/` ディレクトリを作成
2. `requirements.txt` に依存パッケージを記述
3. `app/config.py` で DATABASE_URL 等の環境変数を管理
4. `app/database.py` で SQLAlchemy async session を設定
5. `app/domain/models.py` で Bug モデルを定義
6. `app/domain/schemas.py` で Pydantic スキーマを定義
7. Alembic を初期化してマイグレーションを作成

### Step 2: Backend API 実装
1. `app/repository/base.py` で ABC リポジトリを定義
2. `app/repository/postgres.py` で PostgreSQL 実装
3. `app/usecase/bug_usecase.py` でビジネスロジック（ステータス遷移の制約等）
4. `app/presentation/bugs.py` でエンドポイントを実装
5. `app/main.py` で FastAPI アプリを組み立て（CORS設定含む）

### Step 3: Frontend セットアップ
1. `npx create-next-app@latest frontend --typescript --tailwind --app --src-dir=false`
2. shadcn/ui をインストール
3. `src/` 配下に FSD レイヤーを作成（shared → entities → features → widgets）
4. `src/shared/api/client.ts` で fetch ラッパー
5. `src/entities/bug/model/types.ts` で Bug 型定義
6. `src/entities/bug/api/bug-api.ts` で API クライアント関数

### Step 4: Frontend 画面実装（FSD レイヤー順に積み上げる）
1. **shared** — `src/shared/ui/` に shadcn/ui の re-export、`src/shared/api/client.ts`
2. **entities/bug** — BugCard, BugTable, StatusBadge, SeverityBadge（表示のみ、操作なし）
3. **features/create-bug** — BugForm + use-create-bug（フォーム送信）
4. **features/filter-bugs** — FilterBar + use-filters（フィルター状態管理）
5. **features/update-status** — StatusSelect + use-update-status（ステータス変更）
6. **widgets/bug-list** — FilterBar + BugTable を統合
7. **widgets/stats-cards** — ステータス別・深刻度別の集計カード
8. **widgets/bug-detail** — バグ情報表示 + ステータス変更
9. **pages/dashboard** — StatsCards + BugList を配置してダッシュボード画面を構成
10. **pages/create-bug** — BugForm を配置
11. **pages/bug-detail** — BugDetail を配置
12. **app/** — 各 page.tsx から pages レイヤーを呼ぶだけ（薄いルーティング層）

### Step 5: 接続・動作確認
1. Backend を uvicorn で起動
2. Frontend を next dev で起動
3. CRUD が一通り動くことを確認

---

## 環境変数

### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/vigil
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 設計上の重要な判断

1. **リポジトリパターン（依存の逆転）**
   - BugRepository ABC を定義し、PostgreSQL実装を注入
   - 将来 Notion に差し替える際は NotionBugRepository を作って差し替えるだけ
   - archaive のテスト設計で学んだ Khorikov の原則を実プロダクトに適用

2. **ステータス遷移の制約**
   - open → in_progress → in_review → closed の順序を強制
   - closed → open への差し戻しは許可（再発バグ）
   - usecase 層で制約を実装（repository 層ではない）

3. **将来の拡張に備えた設計**
   - source フィールドで報告元を記録（manual / slack / hubspot / test）
   - 外部連携用のURL/IDフィールドを最初から用意（NULL許容）
   - stats エンドポイントで集計データを返す（将来の分析ダッシュボード用）
