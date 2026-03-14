# Vigil コードベースガイド

> 「どこに何があるか」の地図。全ファイルを読む前にここを読む。

---

## 全体構成

```
vigil/
├── frontend/        # Next.js 15 (App Router)
│   ├── app/         # ルーティング（ページファイルだけ置く）
│   └── src/         # 実際のコード（FSD レイヤー構造）
├── backend/         # FastAPI（オニオンアーキテクチャ）
│   ├── app/
│   └── alembic/     # DB マイグレーション
└── docs/            # 設計ドキュメント
```

---

## フロントエンド：FSD (Feature-Sliced Design)

**レイヤーの依存方向は一方通行：** `pages → widgets → features → entities → shared`
上のレイヤーから下を使うのはOK。逆は禁止。

```
src/
├── entities/     ← 「何のデータか」の定義 + API 呼び出し + 最小 UI
├── features/     ← 「何ができるか」のロジック + 操作 UI
├── widgets/      ← entities + features を組み合わせた複合コンポーネント
├── pages/        ← ルート単位の画面（widgets を並べるだけ）
└── shared/       ← どこからでも使える共通ユーティリティ
```

---

### entities/ ── データの定義と API

| ディレクトリ | 役割 | 主なファイル |
|------------|------|------------|
| `entities/bug/` | バグの型・API・バッジ UI | `model/types.ts`, `api/bug-api.ts`, `ui/BugTable.tsx`, `ui/BugCard.tsx` |
| `entities/milestone/` | マイルストーンの型・API・カード | `model/types.ts`, `api/milestone-api.ts`, `ui/MilestoneCard.tsx` |
| `entities/workflow-column/` | カンバンカラムの型・API | `model/types.ts`, `api/workflow-column-api.ts` |
| `entities/analytics/` | Analytics レスポンス型・API | `model/types.ts`, `api/analytics-api.ts` |
| `entities/integration/` | 統合設定の型・API | `model/types.ts`, `api/integration-api.ts` |
| `entities/user/` | ユーザー型・API・アバター | `model/types.ts`, `api/user-api.ts`, `ui/UserAvatar.tsx` |

**ここを読めば「どんなデータが流れているか」がわかる。**
新しいフィールドを追加するときは必ず `model/types.ts` と `api/*.ts` を触る。

---

### features/ ── ユーザーが「できること」

| ディレクトリ | 役割 |
|------------|------|
| `features/auth/` | GitHub OAuth ログイン・ログアウト・ユーザー状態管理 (`use-auth.ts`) |
| `features/create-bug/` | バグ作成フォーム (`BugForm.tsx`, `use-create-bug.ts`) |
| `features/update-status/` | ステータス変更セレクト (`StatusSelect.tsx`, `use-update-status.ts`) |
| `features/filter-bugs/` | バグ一覧のフィルタバー (`FilterBar.tsx`, `use-filters.ts`) |
| `features/inline-edit/` | テーブルのインライン編集セル (`EditableTextCell.tsx`, `EditableSelectCell.tsx`) |
| `features/kanban/` | カンバン DnD のロジック (`use-kanban-dnd.ts`, `KanbanCard.tsx`, `KanbanColumn.tsx`) |
| `features/milestone/` | マイルストーン作成 (`MilestoneForm.tsx`, `use-create-milestone.ts`) |
| `features/integration-wizard/` | 統合設定ウィザード（4ステップ） |
| `features/workflow-column-settings/` | ワークフローカラム管理 UI |
| `features/view-toggle/` | テーブル ⇄ カンバン切り替えボタン |

**「ボタンを押したときの処理」はここにある。**

---

### widgets/ ── 画面の部品（複合コンポーネント）

| ファイル | 役割 |
|--------|------|
| `widgets/app-shell/` | `AppShell.tsx` + `Sidebar.tsx` + `Header.tsx` — 全ページ共通レイアウト |
| `widgets/bug-list/` | `BugList.tsx` — フィルタ・ページネーション・テーブル/カンバン切り替えを含む一覧 |
| `widgets/bug-detail/` | `BugDetail.tsx` — バグ詳細の全セクション |
| `widgets/kanban-board/` | `KanbanBoard.tsx` — DnD カンバン全体（カラム一覧取得含む） |
| `widgets/stats-cards/` | `StatsCards.tsx` — ダッシュボードの KPI カード |
| `widgets/milestone-list/` | `MilestoneList.tsx` — マイルストーン一覧 + 作成フォーム |
| `widgets/integration-hub/` | `IntegrationFlowCard.tsx` + `IntegrationEventLog.tsx` — 統合設定カード |

---

### pages/ ── ルート単位の画面

各ページは基本的に「Widget を並べるだけ」のシンプルな構成。

| ファイル | URL | 内容 |
|--------|-----|------|
| `pages/dashboard/` | `/` | StatsCards + BugList |
| `pages/bug-detail/` | `/bugs/[id]` | BugDetailPage → BugDetail |
| `pages/create-bug/` | `/bugs/new` | CreateBugPage → BugForm |
| `pages/analytics/` | `/analytics` | AnalyticsPage（トレンド・Severity・担当者別） |
| `pages/milestones/` | `/milestones` | MilestonesPage（MilestoneProgress + MilestoneList） |
| `pages/integrations/` | `/settings/integrations` | IntegrationsPage |

---

### shared/ ── 共通ユーティリティ

| ファイル | 役割 |
|--------|------|
| `shared/api/client.ts` | **全 API 呼び出しの基盤。** `apiClient<T>()` を呼ぶだけで JWT 付きリクエストが飛ぶ |
| `shared/lib/auth-token.ts` | localStorage への JWT 保存・取得 |
| `shared/lib/utils.ts` | `cn()` (Tailwind クラス結合) など |
| `shared/ui/index.ts` | shadcn/ui コンポーネントの再エクスポート |

---

## バックエンド：オニオンアーキテクチャ

**依存方向：** `presentation → usecase → repository ← domain`
`domain` は何にも依存しない中心。

```
backend/app/
├── domain/          ← DB モデル（SQLAlchemy ORM）+ スキーマ（Pydantic）
├── repository/      ← DB アクセス層（SQL を書く場所）
├── usecase/         ← ビジネスロジック（状態遷移・バリデーション）
├── presentation/    ← FastAPI ルーター（HTTP の入出力だけ）
├── connectors/      ← 外部サービス連携（Slack / HubSpot / Notion）
├── database.py      ← DB セッション管理
├── config.py        ← 環境変数
└── main.py          ← アプリ起動・ルーター登録
```

---

### domain/ ── データの定義（バックエンドの核心）

**`models.py`** — SQLAlchemy ORM モデル。テーブル定義そのもの。

| クラス | テーブル | 主なカラム |
|-------|---------|-----------|
| `Bug` | `bugs` | `title`, `status`, `severity`, `assigned_to`, `milestone_id`, `closed_at` |
| `Milestone` | `milestones` | `title`, `due_date`, `status` |
| `WorkflowColumn` | `workflow_columns` | `name`, `slug`, `position`, `is_fixed` |
| `Integration` | `integrations` | `source_type`, `credentials_enc`, `trigger_rules` |
| `IntegrationEvent` | `integration_events` | `status`, `source_ref`, `bug_id` |
| `User` | `users` | `github_id`, `name`, `avatar_url` |

**`schemas.py`** — Pydantic スキーマ。API の入出力の型定義。

| パターン | 例 |
|---------|-----|
| `XxxCreate` | API に POST するとき受け取るボディ |
| `XxxUpdate` | PATCH するとき受け取るボディ（全フィールド Optional） |
| `XxxResponse` | API から返すレスポンス形式 |

---

### repository/ ── DB アクセス

| ファイル | 役割 |
|--------|------|
| `repository/base.py` | `BugRepository` 抽象基底クラス（インターフェース定義） |
| `repository/postgres.py` | `PostgresBugRepository` — 実際の SQL（SQLAlchemy） |
| `repository/milestone_repo.py` | マイルストーン DB 操作 |
| `repository/workflow_column_repo.py` | ワークフローカラム DB 操作 |
| `repository/integration_repo.py` | 統合設定 DB 操作 |
| `repository/user_repo.py` | ユーザー DB 操作 |

**SQL を書く・クエリを最適化するときはここを触る。**

---

### usecase/ ── ビジネスロジック

| ファイル | 役割 |
|--------|------|
| `usecase/bug_usecase.py` | `BugUsecase` — バグの CRUD + `closed_at` 自動管理 |
| `usecase/milestone_usecase.py` | マイルストーンの CRUD + バグ数集計 |
| `usecase/workflow_column_usecase.py` | カラムの CRUD + 固定カラム保護 |
| `usecase/integration_usecase.py` | 統合設定の CRUD + テスト接続 |

**新しいビジネスルール（例: ステータス遷移の制約）はここに書く。**

---

### presentation/ ── HTTP ルーター

| ファイル | エンドポイント |
|--------|-------------|
| `presentation/bugs.py` | `GET/POST /api/bugs`, `GET/PATCH/DELETE /api/bugs/{id}`, `GET /api/bugs/stats` |
| `presentation/milestones.py` | `GET/POST /api/milestones`, `GET/PATCH/DELETE /api/milestones/{id}` |
| `presentation/workflow_columns.py` | `GET/POST /api/workflow-columns`, `PATCH/DELETE /api/workflow-columns/{id}` |
| `presentation/analytics.py` | `GET /api/analytics` |
| `presentation/auth.py` | `GET /api/auth/github`, `GET /api/auth/callback`, `GET /api/auth/me` |
| `presentation/integrations.py` | `GET/POST /api/integrations`, `PATCH/DELETE`, テスト接続 |
| `presentation/webhooks.py` | `POST /api/webhooks/slack`, `POST /api/webhooks/hubspot` |

全ての API ドキュメントは起動後に `http://localhost:8000/docs` で見られる（Swagger UI）。

---

### connectors/ ── 外部サービス連携

```
connectors/
├── base.py           ← 全コネクタ共通インターフェース
├── registry.py       ← source_type → ハンドラの対応マップ
├── encryption.py     ← credentials の暗号化（Fernet）
├── slack/            ← Webhook 受信 + メッセージ送信
├── hubspot/          ← チケットポーリング
└── notion/           ← データベースポーリング（5分ごと）
```

新しいコネクタ（GitHub など）は `connectors/github/` を作って `registry.py` に追加する。

---

## リクエストの流れ（バグ作成を例に）

```
[ユーザー] フォーム送信
    ↓
[BugForm.tsx]
    ↓ use-create-bug.ts
    ↓ bug-api.ts: createBug(data)
    ↓ shared/api/client.ts: POST /api/bugs (JWT付き)
    ↓
[FastAPI: presentation/bugs.py] create_bug()
    ↓ _get_usecase() → BugUsecase(PostgresBugRepository(session))
    ↓
[usecase/bug_usecase.py] create_bug()
    ↓
[repository/postgres.py] create()
    ↓ INSERT INTO bugs ...
    ↓
[PostgreSQL]
    ↑ BugResponse を返す
[201 Created + JSON]
    ↑
[フロントエンドに Bug オブジェクトが返り、一覧に追加される]
```

---

## DB マイグレーション

新しいカラム・テーブルを追加するときの手順：

```bash
# 1. models.py にカラムを追加する

# 2. マイグレーションファイルを自動生成
docker-compose exec backend uv run alembic revision --autogenerate -m "add_xxx_to_bugs"

# 3. 生成されたファイルを確認（backend/alembic/versions/）

# 4. 適用
docker-compose exec backend uv run alembic upgrade head
```

マイグレーションファイルは `backend/alembic/versions/` に日付順で並んでいる。

---

## よくある作業パターン

### バグモデルにフィールドを追加する

1. `backend/app/domain/models.py` — `Bug` クラスにカラム追加
2. `backend/app/domain/schemas.py` — `BugCreate` / `BugUpdate` / `BugResponse` に追加
3. Alembic マイグレーション実行
4. `frontend/src/entities/bug/model/types.ts` — `Bug` 型に追加
5. `frontend/src/features/create-bug/ui/BugForm.tsx` — フォームに入力欄追加
6. `frontend/src/widgets/bug-detail/ui/BugDetail.tsx` — 詳細表示に追加

### 新しい API エンドポイントを追加する

1. `backend/app/domain/schemas.py` — リクエスト・レスポンス型を定義
2. `backend/app/repository/` — DB アクセスメソッドを追加
3. `backend/app/usecase/` — ビジネスロジックを追加
4. `backend/app/presentation/` — ルーターにエンドポイントを追加
5. `backend/app/main.py` — 新しいルーターを `include_router` に追加（新ファイルの場合）
6. `frontend/src/entities/xxx/api/` — API クライアント関数を追加

### 新しいページを追加する

1. `frontend/src/pages/xxx/ui/XxxPage.tsx` — ページコンポーネント作成
2. `frontend/app/xxx/page.tsx` — Next.js ルーティング登録
3. `frontend/src/widgets/app-shell/ui/Sidebar.tsx` の `NAV_ITEMS` にリンク追加（必要なら）

---

## アーキテクチャ上の決定事項・見解

### widgets レイヤーの使い方

**原則: 「2つ以上のページで使い回すものだけ widgets に置く。1ページ専用なら pages に置く。」**

FSD 公式での `widgets` の定義は「複数の features/entities を組み合わせた再利用可能な独立した UI ブロック」。
`shared/ui` より大きく、`pages` より汎用的なもの。

| コンポーネント | 場所 | 理由 |
|-------------|------|------|
| `AppShell`, `Sidebar`, `Header` | `widgets/app-shell/` ✅ | 全ページで使い回している |
| `BugList` | → `pages/dashboard/` に移動すべき | dashboard だけで使っている |
| `BugDetail` | → `pages/bug-detail/` に移動すべき | bug-detail ページだけ |
| `KanbanBoard` | → `pages/board/` に移動すべき | board ページだけ |
| `MilestoneList` | → `pages/milestones/` に移動すべき | milestones ページだけ |
| `StatsCards` | → `pages/dashboard/` に移動すべき | dashboard だけ |
| `IntegrationHub` | → `pages/integrations/` に移動すべき | integrations ページだけ |

現状はまだ未整理のものが `widgets/` に残っているが、将来リファクタリングする際はこの原則で整理する。
