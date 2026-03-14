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

## 現在の機能

- **Issues** — バグ一覧 (テーブル / カンバン切り替え)、インライン編集、Severity・Status フィルタ
- **Board** — DnD カンバンボード。カラムは自由に追加・改名・削除可能、後退ドラッグも対応
- **Milestones** — マイルストーン管理とバグの紐付け、進捗バー表示
- **Analytics** — バグ発生 / 解決トレンド、Severity ドーナツチャート、担当者別クローズ数、前期間比較
- **Integration Hub** — Slack webhook / HubSpot polling / Notion polling で外部イベントを自動バグ化
- **Settings** — ワークフローカラム管理（追加・改名・削除・並び替え）、統合管理

---

## バグ記録フォーマット

### 現在フォームで入力できる項目

| フィールド | 説明 |
|-----------|------|
| **タイトル** | 何が起きているか（1〜2文で端的に） |
| **詳細** | 実際の挙動・期待する挙動・再現手順など |
| **Severity** | Critical / High / Medium / Low |
| **Status** | ワークフローカラムに基づくステータス |
| **担当者** | アサイン先ユーザー |
| **マイルストーン** | 紐付けるマイルストーン |

### 近日実装予定（P1）

以下のフィールドをバグ詳細フォームに追加予定:

| フィールド | 説明 |
|-----------|------|
| **発生環境** | 本番 / ステージング / ローカル など |
| **発生バージョン** | 該当リリースバージョン |
| **発見段階** | 内部テスト / QA / Aegis / 顧客報告 のいずれか |
| **エビデンス添付** | スクリーンショット・ログ・動画など |
| **カテゴリ** | 機能別（例: 認証・決済）/ レイヤ別（UI / API / DB） |

また、CS・顧客向け外部起票フォーム（認証不要、バグ番号発行）も P1 で対応予定。

---

## 起票〜クローズフロー

```
発見（CS / QA / 開発 / 顧客）
  ↓
Vigil に起票（タイトル・詳細・Severity を設定）
  ↓
担当者アサイン → ワークフローカラムに沿って進捗管理
  ↓
修正 → PR にバグ番号を紐付け（GitHub 連携: ロードマップ P1）
  ↓
修正箇所を中心とした手動テスト（重み付けあり）
  ↓
確認 OK → クローズ
```

---

## ロードマップ

### P1 — 近日実装予定

#### GitHub 連携

| 機能 | 内容 |
|------|------|
| PR 自動紐付け | PR タイトル・本文に `VIGIL-{id}` を含めると自動でバグにリンク |
| Issue 双方向同期 | GitHub Issue の作成 / クローズを Vigil に反映（Integration Hub 経由） |
| マージ時ステータス更新 | PR マージ時に対応バグを自動で `in_review` に遷移 |

#### 不具合管理の強化

- バグ詳細フォームに標準フィールド（発生環境・バージョン・発見段階・エビデンス添付）を追加
- カテゴリタグ（機能別 / レイヤ別）の管理画面
- CS・顧客向け外部起票フォーム（認証不要、バグ番号発行）

### P2 — バグ発生の可視化

- 機能別・レイヤ別（UI / API / DB）のバグ発生数をヒートマップ表示
- 「どこで何件・どの Severity のバグが集中しているか」を Analytics ページに追加
- 期間・バージョン・担当者でのドリルダウン

### P3 — リスクベーステスト + Slack 通知

**考え方**: バグの発生状況をもとに「どのシナリオテストをいつ走らせるべきか」を自動で判断し、Slack で通知する。

- バグに「修正した箇所」（変更されたファイル・機能）を紐付け
- Severity × 発見段階 による優先度スコアリング
- リリース前チェックリスト自動生成（修正箇所に絞った手動テスト項目）

#### 仕組み

1. **シナリオテストを機能・カテゴリ単位で登録しておく**
   - 例: `認証フロー`, `決済フロー`, `ユーザー管理` など
   - 各シナリオに対応する機能タグを紐付け

2. **バグの状況からテスト優先度を算出**
   - 直近 N 日間のバグ件数・Severity・発見段階を機能タグごとに集計
   - `スコア = 未クローズ件数 × Severity 係数 × 発見段階係数` で重み付け
   - バグが多い・致命的・顧客報告 → そのカテゴリのシナリオを優先

3. **リリース前にチェックリストを自動生成**
   - スコア上位のシナリオをリリース前必須テストとしてリスト化
   - 「修正を加えた機能」と「バグが集中している機能」の両方をカバー

4. **Slack 通知でテスト実施を促す**
   - リリース N 日前に「今回優先すべきシナリオテスト一覧」を通知
   - チェックリストの消化状況に応じてリマインドの頻度を変化
     - 未着手 → 毎日通知
     - 半分消化済み → 2日に1回
     - 全消化 → 完了通知のみ
   - 未消化のままリリース日を迎えるとアラート

#### イメージ

```
[Slack 通知]
リリース前テストチェックリスト (v1.4.0)

優先度 High:
  [ ] 認証フロー — 直近 7日で Critical 2件・顧客報告あり
  [ ] 決済フロー — 直近 14日で High 3件

優先度 Medium:
  [ ] ユーザー管理 — 修正コミットあり

残り 3/5 未完了 — リリースまで 2日
```

### P3 — テナント分離

**考え方**: プロダクト・チーム・顧客ごとにデータを完全に分離し、1 つの Vigil インスタンスで複数プロジェクトを安全に運用できるようにする。

#### 想定ユースケース

- 社内の複数プロダクト（A サービス・B サービス）を1インスタンスで管理
- 顧客ごとに独立したバグ管理スペースを提供（顧客が自分の報告したバグだけ見える）
- CS チーム・開発チーム・QA チームでアクセス範囲を分ける

#### 設計方針

```
Organization（組織）
  └── Project（プロジェクト）
        ├── Bugs
        ├── Milestones
        ├── Workflow Columns
        ├── Integrations
        └── Members（ロール: owner / member / viewer）
```

- すべてのリソースに `project_id` を持たせ、API レベルで他プロジェクトのデータを参照不可にする
- 招待制メンバーシップ（メールまたは GitHub アカウント）
- ロールベースアクセス制御（RBAC）: `owner` のみプロジェクト設定・メンバー管理が可能
- 将来的に顧客向け `viewer` ロールを追加し、外部起票フォームと連携

---

## 技術スタック

| レイヤー | 採用技術 |
|---------|---------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS v3 + shadcn/ui |
| Backend | FastAPI + SQLAlchemy 2 (async) + Alembic |
| DB | PostgreSQL 16 |
| 認証 | GitHub OAuth + JWT |
| スケジューラ | APScheduler 3 (Notion / HubSpot ポーリング) |
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
| `POSTGRES_USER` | PostgreSQL ユーザー名 | `vigil` |
| `POSTGRES_PASSWORD` | PostgreSQL パスワード | `vigil` |
| `POSTGRES_DB` | PostgreSQL DB 名 | `vigil` |
| `DATABASE_URL` | バックエンドの DB 接続文字列 | `postgresql+asyncpg://vigil:vigil@db:5432/vigil` |
| `CORS_ORIGINS` | 許可する CORS オリジン（カンマ区切り） | `http://localhost:3000` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App の Client ID | (空 = 認証無効) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App の Client Secret | (空) |
| `JWT_SECRET` | JWT 署名キー | `vigil-dev-secret` |
| `ENCRYPTION_KEY` | 統合 credentials の暗号化キー (Fernet) | (要手動設定) |
| `NEXT_PUBLIC_API_URL` | フロントエンドからの API ベース URL | `http://localhost:8000` |

`ENCRYPTION_KEY` は以下のコマンドで生成してください:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

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
│   │   ├── connectors/           # Slack / HubSpot / Notion コネクタ
│   │   ├── di/                   # DI（依存性注入）層
│   │   ├── domain/               # モデル・スキーマ
│   │   ├── infrastructure/       # DB・リポジトリ・外部連携の実装
│   │   │   ├── db/               # DB セッション管理
│   │   │   └── repository/       # リポジトリ実装
│   │   ├── presentation/         # FastAPI ルーター
│   │   ├── repository/           # リポジトリ抽象インターフェース
│   │   └── usecase/              # ビジネスロジック
│   └── alembic/versions/         # マイグレーション
└── frontend/
    ├── app/                       # Next.js App Router（ページファイルのみ）
    └── src/                       # 実装コード（FSD レイヤー構造）
        ├── entities/              # 型定義 + API クライアント
        ├── features/              # UI ロジック (hooks + コンポーネント)
        ├── pages/                 # ページ単位の UI 組み立て
        ├── shared/                # 共通ユーティリティ
        └── widgets/               # 複合ウィジェット (AppShell 等)
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
