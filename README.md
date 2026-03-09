# Vigil

バグトラッキングダッシュボード。Linear にインスパイアされたダークテーマ UI と、Slack / HubSpot / Notion との Integration Hub を備えた社内向けバグ管理ツール。

## 機能

- **Issues** — バグ一覧 (テーブル / カンバン切り替え)、インライン編集、Severity・Status フィルタ
- **Board** — DnD カンバンボード。カラムは自由に追加・改名・削除可能、後退ドラッグも対応
- **Milestones** — マイルストーン管理とバグの紐付け、進捗バー表示
- **Analytics** — バグ発生 / 解決トレンド、Severity ドーナツチャート、担当者別クローズ数、前期間比較
- **Integration Hub** — Slack webhook / HubSpot polling / Notion polling で外部イベントを自動バグ化
- **Settings** — ワークフローカラム管理、統合管理

## 技術スタック

| レイヤー | 採用技術 |
|---------|---------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS v3 + shadcn/ui |
| Backend | FastAPI + SQLAlchemy 2 (async) + Alembic |
| DB | PostgreSQL 16 |
| 認証 | GitHub OAuth + JWT |
| スケジューラ | APScheduler 3 (Notion ポーリング 5分間隔) |
| アーキテクチャ | FSD (Feature-Sliced Design) + オニオンアーキテクチャ |

## 起動方法

### 前提

- Docker / Docker Compose
- GitHub OAuth App (任意 — 認証なしでも動作)

### 環境変数

`.env.example` をコピーして設定:

```bash
cp .env.example .env
```

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App の Client ID | (空 = 認証無効) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App の Client Secret | (空) |
| `JWT_SECRET` | JWT 署名キー | `vigil-dev-secret` |
| `ENCRYPTION_KEY` | 統合 credentials の暗号化キー (Fernet) | (自動生成) |

### 起動

```bash
docker-compose up -d
```

| サービス | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### マイグレーション

初回起動時に自動実行されます。手動で実行する場合:

```bash
docker-compose exec backend uv run alembic upgrade head
```

## プロジェクト構成

```
vigil/
├── backend/
│   ├── app/
│   │   ├── connectors/       # Slack / HubSpot / Notion コネクタ
│   │   ├── domain/           # モデル・スキーマ
│   │   ├── presentation/     # FastAPI ルーター
│   │   ├── repository/       # DB アクセス層
│   │   └── usecase/          # ビジネスロジック
│   └── alembic/versions/     # マイグレーション
└── frontend/
    └── src/
        ├── entities/          # 型定義 + API クライアント
        ├── features/          # UI ロジック (hooks + コンポーネント)
        ├── pages/             # ページ単位の UI 組み立て
        ├── shared/            # 共通ユーティリティ
        └── widgets/           # 複合ウィジェット (AppShell, KanbanBoard 等)
```

## Integration Hub

外部サービスからバグを自動登録する仕組み。

### Slack

Webhook でメッセージ / リアクションを受信 → バグ自動作成。

```
POST /api/webhooks/slack
```

Slack App の設定で Event Subscriptions の Request URL に上記エンドポイントを設定してください。

### HubSpot

チケット作成イベントをポーリングで取得。統合設定画面から API キーを登録。

### Notion

指定したデータベースを 5 分間隔でポーリング。新規ページをバグとして登録。

---

統合の追加・設定は `/settings/integrations` から行います。
