# Vigil

バグトラッキングダッシュボード。Linear にインスパイアされたダークテーマ UI と、Slack / HubSpot / Notion との Integration Hub を備えた社内向けバグ管理ツール。

## 背景 — なぜ Vigil を作るのか

### 課題

社内で発生している不具合が複数のツール（Slack・Notion・HubSpot など）に分散しており、**「いま何件のバグが存在し、どれが致命的で、誰が対応中か」を即座に把握できない**状態にある。

また、CS・QA・開発が同じバグを別々に記録したり、報告フォーマットがバラバラだったりすることで、再現・優先度判断・修正確認のコストが高い。

### 解決したいこと

| # | テーマ | 概要 |
|---|--------|------|
| 1 | **不具合の一元管理** | 社内外で発生したバグをすべて Vigil に集約し、統一フォーマットで記録する |
| 2 | **起票〜修正〜確認フローの明確化** | CS・QA・開発が同じ流れでバグを扱えるようにする |
| 3 | **致命的バグの重み付けと確認** | リリース前に修正箇所を中心とした手動テストを必ず実施する仕組みを作る |

---

## バグ記録フォーマット（予定）

Vigil に登録するバグは以下の項目を標準フォーマットとする。
CS・QA・開発が同じテンプレートで起票することで、情報不足による手戻りをなくす。

| フィールド | 説明 |
|-----------|------|
| **不具合の内容** | 何が起きているか（1〜2文で端的に） |
| **発生環境** | 本番 / ステージング / ローカル など |
| **発生バージョン** | 該当リリースバージョン |
| **詳細** | 実際の挙動・期待する挙動 |
| **再現手順** | ステップバイステップで誰でも再現できる粒度 |
| **発見段階** | 内部テスト / QA / Aegis / 顧客報告 のいずれか |
| **エビデンス** | スクリーンショット・ログ・動画など |
| **カテゴリ** | 機能別（例: 認証・決済）/ レイヤ別（UI / API / DB）— 後追いでも可 |

---

## 起票〜クローズフロー（予定）

```
発見（CS / QA / 開発 / 顧客）
  ↓
Vigil に標準フォーマットで起票
  ↓
Severity・Priority 設定 → 担当者アサイン
  ↓
修正 → PR にバグ番号を紐付け（GitHub 連携）
  ↓
修正箇所を中心とした手動テスト（重み付けあり）
  ↓
確認 OK → クローズ
```

CS やお客様からの報告も同じフォームで入力できる導線を整備する予定。

---

## 現在の機能

- **Issues** — バグ一覧 (テーブル / カンバン切り替え)、インライン編集、Severity・Status フィルタ
- **Board** — DnD カンバンボード。カラムは自由に追加・改名・削除可能、後退ドラッグも対応
- **Milestones** — マイルストーン管理とバグの紐付け、進捗バー表示
- **Analytics** — バグ発生 / 解決トレンド、Severity ドーナツチャート、担当者別クローズ数、前期間比較
- **Integration Hub** — Slack webhook / HubSpot polling / Notion polling で外部イベントを自動バグ化
- **Settings** — ワークフローカラム管理、統合管理

---

## ロードマップ

### GitHub 連携（予定）

| 機能 | 内容 |
|------|------|
| PR 自動紐付け | PR タイトル・本文に `VIGIL-{id}` を含めると自動でバグにリンク |
| Issue 双方向同期 | GitHub Issue の作成 / クローズを Vigil に反映（Integration Hub 経由） |
| マージ時ステータス更新 | PR マージ時に対応バグを自動で `in_review` に遷移 |

### 不具合管理の強化（予定）

- バグ詳細フォームに標準フィールド（発生環境・バージョン・発見段階・エビデンス添付）を追加
- カテゴリタグ（機能別 / レイヤ別）の管理画面
- CS・顧客向け外部起票フォーム（認証不要、バグ番号発行）

### テスト重み付け（予定）

- バグに「修正したコンパス」（変更されたファイル・機能）を紐付け
- リリース前チェックリスト自動生成（修正箇所に絞った手動テスト項目）
- Severity × 発見段階 による優先度スコアリング

---

## 技術スタック

| レイヤー | 採用技術 |
|---------|---------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS v3 + shadcn/ui |
| Backend | FastAPI + SQLAlchemy 2 (async) + Alembic |
| DB | PostgreSQL 16 |
| 認証 | GitHub OAuth + JWT |
| スケジューラ | APScheduler 3 (Notion ポーリング 5分間隔) |
| アーキテクチャ | FSD (Feature-Sliced Design) + オニオンアーキテクチャ |

---

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

---

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

---

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

統合の追加・設定は `/settings/integrations` から行います。
