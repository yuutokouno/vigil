# Vigil 開発ロードマップ

## 現在の実装済み機能

| 機能 | 状態 |
|------|------|
| バグ CRUD（一覧・作成・詳細・更新・削除） | ✅ |
| テーブル / カンバン切り替え、インライン編集 | ✅ |
| ワークフローカラムのカスタマイズ・DnD | ✅ |
| マイルストーン管理 | ✅ |
| Analytics（トレンド・Severity ドーナツ・担当者別） | ✅ |
| Integration Hub（Slack / HubSpot / Notion） | ✅ |
| GitHub OAuth + JWT 認証 | ✅ |

---

## フェーズ別実装計画

### Phase 1 — バグ記録フォーム強化 🔴 `P1`

> バグ管理の基盤となる情報を揃える。他フェーズの前提になる。

| Issue | 内容 | ラベル |
|-------|------|--------|
| #A | バグモデルに `version` / `discovery_stage` フィールド追加（DB + API） | `area: bug-form` `backend` `P1` |
| #B | バグフォームに発見段階・バージョン入力を追加 | `area: bug-form` `frontend` `P1` |
| #C | エビデンス添付機能（スクリーンショット・ログ） | `area: bug-form` `backend` `frontend` `P2` |
| #D | CS・顧客向け外部起票フォーム（認証不要・バグ番号発行） | `area: bug-form` `backend` `frontend` `P2` |

**#A の詳細:**
- Alembic migration: `version VARCHAR(50)`, `discovery_stage VARCHAR(50)`
- `discovery_stage` の値: `internal` / `qa` / `aegis` / `customer`
- `Bug` モデル・`BugCreate` / `BugUpdate` / `BugResponse` スキーマを更新

**#B の詳細:**
- `BugForm.tsx` に `version` テキスト入力を追加
- `BugForm.tsx` に `discovery_stage` セレクト（内部テスト / QA / Aegis / 顧客報告）を追加
- `BugDetail.tsx` にも表示

---

### Phase 2 — GitHub 連携 🔴 `P1`

> PR・Issue 連携でコードと課題を繋ぐ。シナリオテスト同期の前提。

| Issue | 内容 | ラベル |
|-------|------|--------|
| #E | GitHub コネクタ追加（PR 自動紐付け・マージ時ステータス更新） | `area: github-integration` `backend` `P1` |
| #F | GitHub Issue 双方向同期 | `area: github-integration` `backend` `P1` |
| #G | GitHub シナリオテストケース同期（`scenario-test` ラベル Issue → Vigil） | `area: github-integration` `area: test-management` `backend` `P2` |

**#E の詳細:**
- `backend/app/connectors/github/` を新規作成
- `POST /api/webhooks/github` — PR イベント受信
- PR タイトル・本文の `VIGIL-{id}` を検出してバグに `github_pr_url` を紐付け
- PR マージ時にバグを `in_review` に自動遷移

**#F の詳細:**
- GitHub Issue 作成 → Vigil バグ自動作成（`source: GITHUB`）
- Vigil バグクローズ → GitHub Issue に `resolved` ラベル + コメント

**#G の詳細:**
- `scenario-test` ラベルの Issue を定期ポーリングで取得
- Issue 本文の `- [ ] item` をチェックリスト項目としてパース
- チェック完了 → GitHub Issue に `tested` ラベル付与

---

### Phase 3 — テスト管理・リスクベーステスト 🟠 `P2`

> バグの傾向からテスト優先度を自動判断し、Slack でリマインドする。

| Issue | 内容 | ラベル |
|-------|------|--------|
| #H | シナリオテストケース管理 DB + CRUD API | `area: test-management` `backend` `P2` |
| #I | テスト優先度スコアリングロジック | `area: test-management` `backend` `P2` |
| #J | リリース前チェックリスト自動生成（UI 含む） | `area: test-management` `backend` `frontend` `P2` |
| #K | Slack テストリマインド通知（消化状況に応じた頻度制御） | `area: test-management` `backend` `P2` |

**スコアリング式 (#I):**
```
score = 未クローズ件数 × severity_weight × discovery_weight

severity_weight : critical=4, high=3, medium=2, low=1
discovery_weight: customer=3, aegis=2, qa=1.5, internal=1
```

**Slack 通知頻度 (#K):**
- 未着手 → 毎日通知
- 半分消化済み → 2日に1回
- 全消化 → 完了通知のみ
- リリース日超過で未消化 → アラート（`@channel`）

---

### Phase 4 — テナント分離 🟠 `P2`

> 複数プロジェクト・複数会社への対応。会社導入時に必須。

| Issue | 内容 | ラベル |
|-------|------|--------|
| #L | `organizations` / `projects` / `project_members` テーブル追加・全リソースに `project_id` FK 追加 | `area: tenant` `backend` `P2` |
| #M | API レベルのテナント分離（全エンドポイントに `project_id` フィルタ強制） | `area: tenant` `backend` `P2` |
| #N | プロジェクト管理 UI・メンバー招待・RBAC（owner / member / viewer） | `area: tenant` `backend` `frontend` `P2` |

**テーブル設計 (#L):**
```
organizations  (id, name, slug, created_at)
projects       (id, org_id, name, slug, created_at)
project_members(id, project_id, user_id, role)  -- role: owner/member/viewer
bugs           ← project_id FK 追加
milestones     ← project_id FK 追加
workflow_columns ← project_id FK 追加
integrations   ← project_id FK 追加
```

---

### Phase 5 — Analytics 強化・拡張 🟡 `P3`

| Issue | 内容 | ラベル |
|-------|------|--------|
| #O | 機能別・レイヤ別バグ発生ヒートマップ | `area: analytics` `backend` `frontend` `P3` |
| #P | バージョン別・発見段階別ドリルダウン | `area: analytics` `backend` `frontend` `P3` |
| #C | エビデンス添付機能（再掲） | → Phase 1 参照 |
| #D | 外部起票フォーム（再掲） | → Phase 1 参照 |

---

### Phase 6 — デプロイ 🟢 `P1`

> Vercel + Railway で公開。会社導入時に AWS へ移行。

| Issue | 内容 | ラベル |
|-------|------|--------|
| #Q | Vercel デプロイ設定（Frontend） | `area: deploy` `frontend` `P1` |
| #R | Railway デプロイ設定（Backend + DB） | `area: deploy` `backend` `P1` |
| #S | 本番環境用 `.env.example` 整備 | `area: deploy` `P1` |

---

## 実装順序・依存関係

```
Phase 1: #A → #B
              ↓
Phase 2: #E → #F → #G
              ↓
Phase 3: #H → #I → #J → #K
              ↓
Phase 4: #L → #M → #N
              ↓
Phase 5: #C → #D → #O → #P

Phase 6: #Q → #R → #S  ← Phase 1 完了後すぐ並行で進める
```

---

## GitHub Project カンバン配置

| カラム | Issue |
|--------|-------|
| **Todo** | #A, #B, #E, #F, #Q, #R, #S |
| **Backlog** | #C, #D, #G, #H, #I, #J, #K, #L, #M, #N, #O, #P |

---

## デプロイ戦略

| フェーズ | インフラ | 費用概算 |
|---------|---------|---------|
| 開発・検証期 | Vercel + Railway | ~$15-30/月 |
| 会社導入時 | AWS（ECS Fargate + RDS）を会社ごとに専用構築 | ~$50-70/月/社 |

会社導入時は AWS コスト + 運用マージンを月額請求するモデル。
テナント分離（Phase 4）が完了していれば、DB インスタンスを分けるだけで移行できる。
