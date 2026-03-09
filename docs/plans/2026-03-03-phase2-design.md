# Vigil Phase 2 — 全体設計書

## 設計方針

**Linear のシンプルさ + Jira の機能性** を目指す。
Jira の「機能全部盛り」ではなく、Linear の「速くてシンプル」をベースに、Vigil に必要な機能だけを足す。

**主役**: バグ一覧（テーブル / カンバン）
**脇役**: ナビゲーション、フィルター、統計
**削ったもの**: ガントチャート（Phase 2 では不要）、リッチテキストエディタ（過剰）

---

## Phase 2 スコープ

### 追加する機能

| # | 機能 | 優先度 | 理由 |
|---|------|--------|------|
| 1 | アプリケーションシェル（サイドバー + ヘッダー） | P0 | 全機能の土台 |
| 2 | ユーザー認証（GitHub OAuth） | P0 | 誰が何をしたかの追跡に必須 |
| 3 | カンバンボード（D&D） | P0 | ステータス管理の基本 |
| 4 | テーブルのインラインセル編集 | P0 | 操作効率の大幅改善 |
| 5 | マイルストーン管理 | P1 | スプリント/リリース計画 |
| 6 | ダークモード | P1 | 開発者はダークモード必須 |
| 7 | キーボードショートカット | P2 | Linear 的な操作感 |

### 追加しないもの（YAGNI）

- Slack Bot 連携（Phase 3）
- HubSpot 連携（Phase 3）
- AI 分類（Phase 3）
- ガントチャート / タイムライン（需要不明）
- リアルタイム更新 / WebSocket（1人〜少人数利用なので不要）

---

## 画面構成

### アプリケーションシェル

```
┌──────────────────────────────────────────────────────┐
│ [=] VIGIL                          🔍  [avatar] ▼   │  ← ヘッダー
├────────┬─────────────────────────────────────────────┤
│        │                                             │
│  Nav   │          メインコンテンツ                     │
│        │                                             │
│ Issues │  ┌─ ビュー切り替え ─────────────────────┐    │
│ Board  │  │ [テーブル] [ボード] [統計]            │    │
│ Miles  │  └─────────────────────────────────────┘    │
│ ----   │                                             │
│ Setti  │  ┌─ フィルター + 検索 ────────────────┐     │
│        │  └────────────────────────────────────┘     │
│        │                                             │
│        │  ┌─ コンテンツ ───────────────────────┐     │
│        │  │                                    │     │
│        │  │  テーブル / カンバン / 統計         │     │
│        │  │                                    │     │
│        │  └────────────────────────────────────┘     │
│        │                                             │
└────────┴─────────────────────────────────────────────┘
```

**サイドバー（主役ではない = 控えめに）:**
- 幅: 240px（折りたたみ可能 → 60px アイコンのみ）
- 項目: Issues（一覧）、Board（カンバン）、Milestones、Settings
- ダークカラー背景（Linear 風）

**ヘッダー:**
- 左: ハンバーガー + ロゴ
- 中央: グローバル検索（Cmd+K）
- 右: ユーザーアバター + ドロップダウン

### 1. Issues ビュー（テーブル）— 主役

```
┌─────────────────────────────────────────────────────┐
│ Issues                    [+ 新規バグ]  [テーブル|ボード]│
├─────────────────────────────────────────────────────┤
│ 🔍 検索...  [ステータス▼] [深刻度▼] [カテゴリ▼]       │
├─────────────────────────────────────────────────────┤
│ ☐  深刻度   タイトル          ステータス  優先度  担当者 │
│────────────────────────────────────────────────────│
│ ☐  🔴 Crit  TIFファイルが...  [未対応 ▼]  P0     太郎  │  ← クリックで
│ ☐  🟡 Med   レイアウト崩れ    [対応中 ▼]  P2     花子  │     インライン編集
│ ☐  🟢 Low   ログインtypo     [検証待 ▼]  P3     -    │
│                                                     │
│                        << 1 2 3 >>                   │
└─────────────────────────────────────────────────────┘
```

**インラインセル編集の仕様:**
- **深刻度**: クリック → ドロップダウン → 選択で即時保存
- **タイトル**: クリック → テキスト入力 → フォーカスアウトで即時保存
- **ステータス**: クリック → ドロップダウン（遷移制約付き） → 選択で即時保存
- **優先度**: クリック → ドロップダウン → 選択で即時保存
- **担当者**: クリック → テキスト入力 → フォーカスアウトで即時保存
- **楽観的 UI**: 即座に表示更新 → バックグラウンドで API → 失敗時リバート
- **Escape**: 編集キャンセル
- **Tab**: 次のセルへ移動

### 2. Board ビュー（カンバン）

```
┌─────────────────────────────────────────────────────┐
│ Board                     [+ 新規バグ]  [テーブル|ボード]│
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ 未対応(5) │ │ 対応中(3)│ │ 検証待(2)│ │ 完了(8)  │ │
│ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ │
│ │┌────────┐│ │┌────────┐│ │┌────────┐│ │┌────────┐│ │
│ ││ 🔴 P0  ││ ││ 🟡 P2  ││ ││ 🟢 P3  ││ ││ 🟡 P2  ││ │
│ ││ TIFが  ││ ││ レイア ││ ││ ログイ ││ ││ ヘッダ ││ │
│ ││ 開けな ││ ││ ウト崩 ││ ││ ンtypo ││ ││ ー修正 ││ │
│ ││ い     ││ ││ れ     ││ ││        ││ ││        ││ │
│ ││ 担当:太││ ││ 担当:花││ ││ 担当:- ││ ││ 担当:太││ │
│ │└────────┘│ │└────────┘│ │└────────┘│ │└────────┘│ │
│ │┌────────┐│ │          │ │          │ │┌────────┐│ │
│ ││ ...    ││ │          │ │          │ ││ ...    ││ │
│ │└────────┘│ │          │ │          │ │└────────┘│ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────┘
```

**D&D の仕様:**
- ライブラリ: `@dnd-kit/core` + `@dnd-kit/sortable`
- カード間のドラッグ: ステータス遷移制約を守る（不正な遷移先は赤くハイライト）
- カラム内のソート: 優先度順（P0 → P3）
- ドロップ時: 楽観的 UI → PATCH API → 失敗時リバート

### 3. Milestones ビュー

```
┌─────────────────────────────────────────────────────┐
│ Milestones                         [+ 新規マイルストーン]│
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │ v1.2 リリース              2026-03-15         │   │
│ │ ████████████░░░░░░░░  60% (6/10 完了)         │   │
│ │                                               │   │
│ │ 紐づくバグ:                                    │   │
│ │  🔴 TIFファイルが開けない        未対応         │   │
│ │  🟡 レイアウト崩れ              対応中         │   │
│ │  🟢 ログインtypo               検証待ち        │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │ v1.1 ホットフィックス          2026-03-01      │   │
│ │ ████████████████████  100% (4/4 完了)  ✓      │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**マイルストーン仕様:**
- タイトル + 期限日 + 説明
- バグの紐づけ（bugs テーブルに milestone_id FK 追加）
- 進捗バー（紐づくバグのうち closed の割合）
- アニメーション: 完了時にチェックマークのバウンスアニメーション（Framer Motion）

### 4. 統計ビュー

既存の StatsCards を拡張。カテゴリ別・深刻度別のチャートを追加。
（Phase 2 では簡易的なバーチャート。Recharts は Phase 3 で検討）

---

## 技術スタック追加

| ライブラリ | 用途 | 理由 |
|-----------|------|------|
| `@tanstack/react-table` | テーブル管理 + インライン編集 | 業界標準。ソート・フィルター・編集を統合管理 |
| `@dnd-kit/core` + `@dnd-kit/sortable` | カンバンの D&D | React 18 対応、アクセシビリティ対応 |
| `framer-motion` | マイルストーン完了アニメーション | React アニメーションの標準 |
| `next-auth` (Auth.js v5) | GitHub OAuth 認証 | Next.js 公式推奨の認証ライブラリ |
| `lucide-react` | アイコン | shadcn/ui と統合済み |
| `next-themes` | ダークモード切り替え | Next.js のテーマ管理標準 |

---

## データモデル変更

### users テーブル（新規）

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(300),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### milestones テーブル（新規）

```sql
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
        -- active | completed | cancelled
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### bugs テーブル変更

```sql
-- 追加カラム
ALTER TABLE bugs ADD COLUMN milestone_id UUID REFERENCES milestones(id);
ALTER TABLE bugs ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE bugs ADD COLUMN assigned_to_id UUID REFERENCES users(id);
-- assigned_to (VARCHAR) は後方互換のため残す。段階的に assigned_to_id に移行
```

---

## API エンドポイント追加

### 認証

```
GET    /api/auth/github          GitHub OAuth 開始
GET    /api/auth/github/callback GitHub コールバック
GET    /api/auth/me              現在のユーザー情報
POST   /api/auth/logout          ログアウト
```

### マイルストーン

```
POST   /api/milestones           マイルストーン作成
GET    /api/milestones           マイルストーン一覧
GET    /api/milestones/{id}      マイルストーン詳細（紐づくバグ含む）
PATCH  /api/milestones/{id}      マイルストーン更新
DELETE /api/milestones/{id}      マイルストーン削除
```

### ユーザー

```
GET    /api/users                ユーザー一覧（担当者選択用）
GET    /api/users/{id}           ユーザー詳細
```

---

## フロントエンド FSD レイヤー追加

```
src/
├── entities/
│   ├── bug/          # 既存
│   ├── user/         # 新規: User 型, UserAvatar, user-api
│   └── milestone/    # 新規: Milestone 型, MilestoneCard, milestone-api
│
├── features/
│   ├── create-bug/       # 既存
│   ├── filter-bugs/      # 既存
│   ├── update-status/    # 既存
│   ├── inline-edit/      # 新規: EditableCell, use-inline-edit
│   ├── kanban/           # 新規: KanbanBoard, KanbanCard, use-kanban-dnd
│   ├── auth/             # 新規: LoginButton, use-auth
│   └── milestone/        # 新規: MilestoneForm, use-create-milestone
│
├── widgets/
│   ├── bug-list/         # 既存 → TanStack Table で再構築
│   ├── bug-detail/       # 既存
│   ├── stats-cards/      # 既存
│   ├── app-shell/        # 新規: Sidebar, Header, Layout
│   ├── kanban-board/     # 新規: カンバンボード統合
│   └── milestone-list/   # 新規: マイルストーン一覧
│
├── pages/
│   ├── dashboard/        # 既存 → ビュー切り替え対応
│   ├── create-bug/       # 既存
│   ├── bug-detail/       # 既存
│   ├── milestones/       # 新規
│   ├── settings/         # 新規
│   └── login/            # 新規
```

---

## 実装ステップ（依存順）

### Step 7: アプリケーションシェル + ダークモード
1. `next-themes` 導入、globals.css にダークモードトークン追加
2. `widgets/app-shell/` — Sidebar + Header + Layout
3. 全ページを AppShell でラップ
4. Lucide Icons 導入
5. サイドバーの折りたたみ機能
6. ビュー切り替えタブ（テーブル / ボード）の UI だけ先に作る

### Step 8: ユーザー認証（GitHub OAuth）
1. Backend: `users` テーブル + マイグレーション
2. Backend: GitHub OAuth エンドポイント（`/api/auth/*`）
3. Backend: JWT セッション管理
4. Frontend: `next-auth` (Auth.js v5) 設定
5. Frontend: `features/auth/` — LoginButton, use-auth
6. Frontend: ヘッダーにユーザーアバター + ログイン/ログアウト
7. 認証ガード（未ログインは /login にリダイレクト）

### Step 9: テーブルのインラインセル編集
1. `@tanstack/react-table` 導入
2. `features/inline-edit/` — EditableCell（テキスト / ドロップダウン）
3. `widgets/bug-list/` を TanStack Table で再構築
4. 楽観的 UI + エラー時リバート
5. キーボード操作（Tab / Escape / Enter）

### Step 10: カンバンボード
1. `@dnd-kit/core` + `@dnd-kit/sortable` 導入
2. `features/kanban/` — KanbanCard, use-kanban-dnd
3. `widgets/kanban-board/` — 4カラム（ステータス別）
4. D&D でステータス遷移（制約チェック付き）
5. ビュー切り替え（テーブル ↔ ボード）の配線

### Step 11: マイルストーン管理
1. Backend: `milestones` テーブル + `bugs.milestone_id` マイグレーション
2. Backend: マイルストーン CRUD API
3. Frontend: `entities/milestone/` — 型定義, API, MilestoneCard
4. Frontend: `features/milestone/` — MilestoneForm
5. Frontend: `widgets/milestone-list/` + `pages/milestones/`
6. `framer-motion` でマイルストーン完了アニメーション
7. バグ一覧でマイルストーンフィルター追加

### Step 12: 統合テスト + UI/UX ポリッシュ
1. 全機能の動作確認
2. Lighthouse アクセシビリティ 100% 目標
3. レスポンシブ確認（320px〜1440px）
4. キーボードショートカット（Cmd+K 検索、N 新規作成等）

---

## カラーパレット（ブランドアイデンティティ）

Vigil = 「監視」「見張り」。落ち着いた、信頼感のあるカラー。

```css
:root {
  /* Brand */
  --vigil-primary: 230 80% 56%;      /* Indigo-ish blue */
  --vigil-primary-hover: 230 80% 48%;

  /* Status colors */
  --status-open: 0 72% 51%;          /* Red */
  --status-in-progress: 217 91% 60%; /* Blue */
  --status-in-review: 45 93% 47%;    /* Amber */
  --status-closed: 142 71% 45%;      /* Green */

  /* Severity */
  --severity-critical: 0 72% 51%;
  --severity-high: 25 95% 53%;
  --severity-medium: 45 93% 47%;
  --severity-low: 142 71% 45%;
}
```

---

## 削除・見送りの判断

| 検討した機能 | 判断 | 理由 |
|-------------|------|------|
| Google OAuth | 見送り | GitHub OAuth のみで十分。archaive チームは全員 GitHub アカウントを持っている |
| Mermaid.js | 見送り | マイルストーンの図解は Phase 2 では過剰。プログレスバーで十分 |
| Recharts | 見送り | 統計チャートは Phase 3。Phase 2 は数字カードで十分 |
| リアルタイム更新 | 見送り | 少人数チームなので更新競合リスクは低い |
| コメント機能 | 見送り | Phase 3。今はバグ説明文で十分 |
