# Vigil 全面改修設計書

**日付**: 2026-03-04
**スコープ**: UI リデザイン / Board 修正 / マイルストーン連携 / 分析ページ
**スタイル指針**: Linear 風（ダークベース・超ミニマル・密度優先）

---

## 1. デザインシステム

### カラーパレット（ダーク固定）

| トークン | 値 | 用途 |
|---|---|---|
| `--bg-base` | `#0A0A0B` | ページ背景 |
| `--bg-elevated` | `#111114` | サイドバー |
| `--bg-card` | `#16161A` | カード・パネル |
| `--bg-hover` | `#1E1E24` | ホバー状態 |
| `--border` | `#252529` | 区切り線 |
| `--text-primary` | `#E2E2E5` | 本文 |
| `--text-muted` | `#6E6E7A` | ラベル・サブ情報 |
| `--text-faint` | `#3D3D46` | プレースホルダー |
| `--accent` | `#5E6AD2` | Linear シグネチャーインジゴ |
| `--accent-hover` | `#6B79E0` | アクセントホバー |
| `--severity-critical` | `#EF4444` | クリティカル |
| `--severity-high` | `#F97316` | 高 |
| `--severity-medium` | `#EAB308` | 中 |
| `--severity-low` | `#22C55E` | 低 |

### タイポグラフィ

- フォント: Inter（現状維持）
- ベースサイズ: 13px（密度優先）
- ウェイト: 400（本文）/ 500（強調）/ 600（見出し）
- Letter-spacing: -0.01em

### コンポーネント原則

- カード: `border` のみ（box-shadow なし）、`rounded-md`（8px）
- ボタン Primary: accent 背景
- ボタン Ghost: border + hover bg
- 入力欄: bg-card + border、フォーカスで accent border

---

## 2. 機能改修

### 2-A. Board ビュー修正

**問題**:
1. `VALID_TRANSITIONS` でステータス間遷移が制限されている
2. カード全体がドラッグ対象なので、タイトルクリックと競合する
3. コラム幅が狭くカードが読みにくい

**修正方針**:
- `use-kanban-dnd.ts` の `VALID_TRANSITIONS` バリデーションを削除（任意遷移許可）
- `KanbanCard` に `GripVertical` アイコンをドラッグハンドルとして追加
- コラム幅: `min-w-[280px]`
- カード内にマイルストーンバッジを表示

### 2-B. マイルストーン連携

**バックエンド変更**:
- `Bug` モデルに `milestone_id: UUID | null` FK カラム追加（Alembic マイグレーション）
- `BugCreate` / `BugUpdate` スキーマに `milestone_id` 追加
- `GET /api/bugs` レスポンスに `milestone_id` を含める

**フロントエンド変更**:
- `Bug` 型に `milestone_id: string | null` 追加
- バグ作成フォームにマイルストーンセレクター追加
- バグ詳細ページでマイルストーン表示・変更
- マイルストーン一覧カードをクリックすると、そのマイルストーンのバグ一覧にフィルター
- カンバンカードにマイルストーン名バッジを表示

### 2-C. 分析ページ（`/analytics` 新設）

**バックエンド**: `/api/bugs/analytics` エンドポイント

```
GET /api/bugs/analytics
  ?period=7d|30d|90d
  &compare_to=prev     # 前期間との比較

Response:
  current: { daily: [{date, created, closed}], avg_close_hours, by_severity, by_assignee }
  previous: { ... }   # compare_to=prev の場合
  milestones: [{ title, total, closed, rate }]
```

**フロントエンド**:
- サイドバーに `/analytics`（`BarChart2` アイコン）追加
- Recharts を追加（`npm install recharts`）
- グラフ構成:
  1. 折れ線グラフ: 日別バグ発生数 vs 解決数（期間比較オーバーレイ）
  2. 棒グラフ: Severity 別内訳（今期 vs 前期）
  3. テーブル: 担当者別クローズ数・平均クローズ時間
  4. カード: マイルストーン達成率

### 2-D. UI 全体改修

- **Sidebar**: 13px テキスト / 16px アイコン、アクティブ = accent 左ボーダー + subtle bg
- **Header 廃止**: ページタイトル + アクションボタンをページ内インライン化
- **ダークモード固定**: `globals.css` で HTML に `dark` クラスを強制適用
- **tailwind.config**: カラートークンを CSS 変数でオーバーライド

---

## 3. 実装順序

1. **デザイントークン** - `globals.css` + `tailwind.config.ts` 更新
2. **レイアウト** - AppShell / Sidebar / Header 改修
3. **Board 修正** - ドラッグハンドル・遷移制限撤廃
4. **マイルストーン連携** - バックエンドマイグレーション → フロント
5. **分析ページ** - バックエンド API → フロントチャート

---

## 4. 技術的追加依存

| パッケージ | 用途 | 追加先 |
|---|---|---|
| `recharts` | チャート描画 | frontend |

外部連携（GitHub / Slack / Notion）は本設計スコープ外とし、後続フェーズとする。
