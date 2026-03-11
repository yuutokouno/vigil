# Vigil プロダクト仕様書

> 作成日: 2026-03-11

---

## 1. プロダクト概要

### 課題

社内で発生した不具合が Slack・Notion・HubSpot に分散しており、「いま何件のバグが存在し、誰が対応中か」を即座に把握できない。CS・QA・開発が同じバグを別々に記録するため、再現・優先度判断・修正確認のコストが高い。

### 解決方針

| # | テーマ | 内容 |
|---|--------|------|
| 1 | **不具合の一元管理** | 社内外で発生したバグをすべて Vigil に集約 |
| 2 | **フローの明確化** | CS・QA・開発が同じプロセスでバグを扱う |
| 3 | **致命的バグの重み付け** | リリース前に修正箇所を中心とした手動テストを必ず実施 |

---

## 2. 現在の実装済み機能

| 機能 | 状態 | 主要ファイル |
|------|------|-------------|
| バグ CRUD（一覧・作成・詳細・更新・削除） | ✅ | `pages/bugs/`, `entities/bug/` |
| テーブル / カンバン切り替え + インライン編集 | ✅ | `widgets/bug-list/`, `widgets/kanban-board/` |
| ワークフローカラムのカスタマイズ・DnD | ✅ | `entities/workflow-column/`, `pages/settings/` |
| マイルストーン管理 + 進捗表示 | ✅ | `pages/milestones/`, `widgets/milestone-list/` |
| Analytics（トレンド・Severity ドーナツ・担当者別） | ✅ | `pages/analytics/` |
| Integration Hub（Slack / HubSpot / Notion） | ✅ | `widgets/integration-hub/`, `connectors/` |
| GitHub OAuth + JWT 認証 | ✅ | `features/auth/`, `backend/app/auth/` |

---

## 3. バグ記録フォーマット（標準）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `title` | string | 何が起きているか（1〜2文） |
| `description` | string | 実際の挙動・期待する挙動 |
| `severity` | enum | critical / high / medium / low |
| `status` | string | ワークフローカラムの slug |
| `assignee` | string? | 担当者名 |
| `milestone_id` | uuid? | 紐付けマイルストーン |
| `version` *(Phase 1)* | string? | 発生バージョン（例: `v1.4.0`） |
| `discovery_stage` *(Phase 1)* | enum? | internal / qa / aegis / customer |
| `github_pr_url` *(Phase 2)* | string? | 紐付け PR URL |
| `source` *(Integration)* | enum? | MANUAL / SLACK / HUBSPOT / NOTION / GITHUB |

---

## 4. フェーズ別実装計画

### Phase 1 — バグ記録フォーム強化 🔴 `P1`

**目的**: 発見段階・バージョン情報を記録することで、バグの傾向分析と顧客報告の追跡を可能にする。

| Issue | 内容 | 工数目安 |
|-------|------|---------|
| #A | DB マイグレーション: `version`, `discovery_stage` フィールド追加 | 1h |
| #B | バグフォーム UI: version 入力 + discovery_stage セレクト追加 | 2h |
| #C | エビデンス添付（スクリーンショット・ログ）| 4h |
| #D | CS・顧客向け外部起票フォーム（認証不要・バグ番号発行） | 4h |

**#A 実装詳細:**
```sql
-- Alembic migration
ALTER TABLE bugs ADD COLUMN version VARCHAR(50);
ALTER TABLE bugs ADD COLUMN discovery_stage VARCHAR(50)
  CHECK (discovery_stage IN ('internal', 'qa', 'aegis', 'customer'));
```

**#D バグ番号フォーマット:** `VIGIL-{sequential_number}` (例: `VIGIL-0042`)

---

### Phase 2 — GitHub 連携 🔴 `P1`

**目的**: PR・Issue とバグを連携し、コードの変更履歴からバグの修正状況を自動追跡する。

| Issue | 内容 | 工数目安 |
|-------|------|---------|
| #E | GitHub コネクタ（PR 自動紐付け・マージ時ステータス更新） | 4h |
| #F | GitHub Issue 双方向同期 | 3h |
| #G | シナリオテストケース同期（`scenario-test` ラベル Issue） | 3h |

**PR 紐付けルール:**
- PR タイトルまたは本文に `VIGIL-{id}` が含まれると自動紐付け
- PR マージ → バグを `in_review` に自動遷移
- `POST /api/webhooks/github` でイベント受信（GitHub App or Personal Access Token）

---

### Phase 3 — テスト管理・リスクベーステスト 🟠 `P2`

**目的**: バグの傾向から「どのテストを優先すべきか」を自動判断し、リリース品質を担保する。

| Issue | 内容 | 工数目安 |
|-------|------|---------|
| #H | シナリオテストケース管理（DB + CRUD API） | 3h |
| #I | テスト優先度スコアリングロジック | 2h |
| #J | リリース前チェックリスト自動生成（UI 含む） | 4h |
| #K | Slack テストリマインド通知 | 2h |

**スコアリング式:**
```
score = 未クローズ件数 × severity_weight × discovery_weight

severity_weight : critical=4, high=3, medium=2, low=1
discovery_weight: customer=3, aegis=2, qa=1.5, internal=1
```

**Slack 通知頻度:**
| 状態 | 通知頻度 |
|------|---------|
| 未着手 | 毎日 |
| 50% 消化 | 2日に1回 |
| 全消化 | 完了通知のみ |
| リリース日超過・未消化 | `@channel` アラート |

---

### Phase 4 — テナント分離 🟠 `P2`

**目的**: 複数プロジェクト・複数会社への対応。1インスタンスで複数チームが安全に利用できる。

| Issue | 内容 | 工数目安 |
|-------|------|---------|
| #L | `organizations` / `projects` / `project_members` テーブル追加 | 4h |
| #M | API レベルのテナント分離（全エンドポイントに `project_id` フィルタ強制） | 3h |
| #N | プロジェクト管理 UI・メンバー招待・RBAC | 4h |

**テーブル設計:**
```
organizations   (id, name, slug, created_at)
projects        (id, org_id, name, slug, created_at)
project_members (id, project_id, user_id, role)  -- owner/member/viewer
```

**RBAC:**
| ロール | 権限 |
|-------|------|
| `owner` | プロジェクト設定・メンバー管理・全操作 |
| `member` | バグ作成・更新・削除 |
| `viewer` | 読み取りのみ（外部起票フォームからの顧客向け） |

---

### Phase 5 — Analytics 強化 🟡 `P3`

**目的**: バグの発生傾向をより詳細に可視化し、品質改善のインサイトを提供する。

| Issue | 内容 | 工数目安 |
|-------|------|---------|
| #O | 機能別・レイヤ別バグ発生ヒートマップ | 4h |
| #P | バージョン別・発見段階別ドリルダウン | 3h |

**ヒートマップ軸:**
- 横軸: 週（直近 8週）
- 縦軸: 機能カテゴリ（認証・決済・ユーザー管理 etc.）
- セルの濃さ: バグ発生数（深刻度で重み付け）

---

### Phase 6 — デプロイ 🟢 `P1`

**目的**: Vercel + Railway で本番公開。会社導入時に AWS へ移行。

| Issue | 内容 | 工数目安 |
|-------|------|---------|
| #Q | Vercel デプロイ設定（Frontend） | 1h |
| #R | Railway デプロイ設定（Backend + DB） | 1h |
| #S | 本番環境用 `.env.example` 整備 | 0.5h |

**デプロイ戦略:**
| フェーズ | インフラ | 費用概算 |
|---------|---------|---------|
| 開発・検証期 | Vercel + Railway | ~$15-30/月 |
| 会社導入時 | AWS（ECS Fargate + RDS）会社ごとに専用構築 | ~$50-70/月/社 |

---

### Phase 7 — QA プラットフォーム強化 🟠 `P2`

**目的**: テストを「計画→実行→結果確認」まで Vigil 内で完結させる。Bug Bash でチーム全体のバグ発見を活性化する。

| Issue | 内容 | 工数目安 |
|-------|------|---------|
| #T | テスト実行バッチ API（シナリオ一括実行・非同期ジョブ） | 4h |
| #U | テスト結果タイムライン UI（実行履歴・成功率グラフ） | 3h |
| #V | コントリビューターランキング（バグ発見数・修正数・テスト消化数） | 3h |
| #W | Bug Bash イベント管理（期間設定・スコアボード・Slack 通知） | 4h |

**テスト実行バッチ (#T):**
```
POST /api/test-runs
  body: { scenario_ids: [...] }
  → 非同期ジョブ起動（APScheduler）
  → 進捗: GET /api/test-runs/{id}
  → 完了時: Slack 通知 + GitHub PR コメント（PR 紐付け時）
```

**Bug Bash スコア計算 (#W):**
```
報告バグのポイント: critical=10, high=5, medium=2, low=1
順位: イベント期間中の累計ポイント
イベント終了 → Slack でスコアボード通知
```

---

## 5. 技術スタック

| レイヤー | 採用技術 |
|---------|---------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS v3 + shadcn/ui |
| Backend | FastAPI + SQLAlchemy 2 (async) + Alembic |
| DB | PostgreSQL 16 |
| 認証 | GitHub OAuth + JWT |
| スケジューラ | APScheduler 3 |
| アーキテクチャ | FSD (Feature-Sliced Design) + オニオンアーキテクチャ |

---

## 6. アーキテクチャ

```
vigil/
├── backend/
│   ├── app/
│   │   ├── connectors/       # Slack / HubSpot / Notion / GitHub
│   │   ├── domain/           # モデル・スキーマ
│   │   ├── presentation/     # FastAPI ルーター
│   │   ├── repository/       # DB アクセス層
│   │   └── usecase/          # ビジネスロジック
│   └── alembic/versions/
└── frontend/
    └── src/
        ├── entities/          # 型定義 + API クライアント
        ├── features/          # UI ロジック (hooks + コンポーネント)
        ├── pages/             # ページ単位の UI
        ├── shared/            # 共通ユーティリティ
        └── widgets/           # 複合ウィジェット
```

---

## 7. 実装優先順位サマリー

```
🔴 P1 (すぐやる)
  Phase 1: #A → #B
  Phase 2: #E → #F
  Phase 6: #Q → #R → #S  ← 並行で進める

🟠 P2 (次の段階)
  Phase 1: #C → #D
  Phase 2: #G
  Phase 3: #H → #I → #J → #K
  Phase 4: #L → #M → #N
  Phase 7: #T → #U → #V → #W

🟡 P3 (余裕があれば)
  Phase 5: #O → #P
```

---

## 8. KPI・成功指標

| 指標 | 目標値 | 計測方法 |
|------|--------|---------|
| バグ起票から担当者アサインまでの時間 | < 2時間 | `created_at` - `assigned_at` |
| クリティカルバグのクローズ時間 | < 24時間 | `created_at` - `closed_at` (severity=critical) |
| リリース前テスト消化率 | 100% | `test_checklist_items.is_checked` 集計 |
| 顧客報告バグの割合 | < 10% | `discovery_stage='customer'` / 全バグ数 |
| Bug Bash 参加率 | > 80% | イベント参加者数 / アクティブメンバー数 |
