# Stop the Line（バグ閾値開発停止）機能 設計ドキュメント

> 作成日: 2026-03-14

---

## 1. コンセプト

### アイデアの出所

トヨタ生産方式の「アンドン」に由来する **Stop the Line** の概念。品質が一定ラインを下回ったら新機能開発を止めてバグ修正に集中する。ソフトウェア開発では確立されたプラクティス。

### 類似プロダクト

**Blacksmith** など、CI/CD・開発フローの品質ゲートを自動化するツールが類似のコンセプトを持つ。Vigil がバグトラッカーとして差別化するポイントは「**バグの実態データをそのまま判定に使う**」こと。外部ツールとの連携が不要で、バグ登録した瞬間に閾値チェックが走る。

---

## 2. 費用対効果（ROI）の考え方

### なぜこれが価値を持つか

| コスト | 内容 |
|--------|------|
| バグが蓄積したときのコスト | 技術的負債の増加・リリース遅延・顧客離脱 |
| 開発停止のコスト | 新機能開発が一時止まる（数日〜1週間） |

**「早期に止める」方が長期コストは低い。** Critical バグを放置して新機能を積み続けると、後の修正コストが指数的に増える（バグフィックスの平均コストは発見が遅れるほど高くなる）。

### 費用対効果を出すための工夫

1. **閾値のチューニング精度を上げる**
   - 初期はデフォルト値（critical 1件、スコア合計 10）で運用
   - 実際の発動頻度・解除までの日数を記録し、閾値が適切かをデータで見直す
   - 「発動しすぎ = 閾値が厳しすぎる」「まったく発動しない = 形骸化」のどちらも避ける

2. **停止期間の可視化**
   - 「いつ入った・いつ解除・何件減った」をログとして残す
   - 「この停止によってバグが X 件減った」を後から振り返れるようにする
   - CTO・PM への説得材料になる

3. **「停止」ではなく「注意喚起」のグラデーション**
   - 閾値の 80% → ⚠️ 黄色アラート（予告）
   - 閾値の 100% → 🔴 開発停止フェーズ（ブロック）
   - これにより突然止まる衝撃を和らげ、チームが準備できる

4. **チームへの合意形成サポート**
   - ツールだけで強制するのは難しい。「なぜこの機能が必要か」を伝えるための材料として、停止発動の履歴・バグ推移グラフをそのままダッシュボードから共有できるようにする

---

## 3. 機能設計

### 3-1. 閾値の計算式

```
stop_score = Σ (直近 N 日間のオープンバグ × severity_weight)

severity_weight:
  critical = 4
  high     = 3
  medium   = 2
  low      = 1

発動条件（OR）:
  A. stop_score >= score_threshold（デフォルト: 10）
  B. critical バグ件数 >= critical_limit（デフォルト: 1 → 即トリガー）
```

### 3-2. 状態遷移

```
[通常フェーズ]
    ↓ バグ作成・更新時に閾値チェック
    ↓ 条件 A or B を満たしたら
[⚠️ 警告フェーズ]  ← スコアが閾値の 80% を超えたとき
    ↓ 閾値 100% 突破
[🔴 開発停止フェーズ]
    → Slack 通知（@channel）
    → ダッシュボードにバナー表示
    → 特定操作に警告ダイアログ
    ↓ スコアが閾値を下回ったとき（or 手動解除）
[通常フェーズ]
    → Slack 通知（解除）
```

### 3-3. 「開発停止フェーズ」中の動作

| 操作 | 動作 |
|------|------|
| バグの新規作成 | 通常通り可能（バグ修正の起票は止めない） |
| バグのステータスを "closed" に変更 | 通常通り可能（修正推奨） |
| バグのステータスを "closed" 以外に変更（open/in_progress 等） | 警告ダイアログを表示してから実行 |
| マイルストーンの作成・編集 | 警告ダイアログを表示 |

> **Note:** Vigil は現状バグトラッカー専用なので「新機能開発のブロック」は主に警告ダイアログで意識づけする。GitHub Issues や他の開発管理ツールとの連携が整ったら、そちらへの通知・ラベル付けも追加する。

---

## 4. データ設計

### system_settings テーブル

```sql
CREATE TABLE system_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB        NOT NULL,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 閾値設定の例
INSERT INTO system_settings (key, value) VALUES (
  'stop_the_line',
  '{
    "enabled": true,
    "window_days": 7,
    "score_threshold": 10,
    "warning_ratio": 0.8,
    "critical_immediate": true,
    "critical_limit": 1,
    "severity_weights": {
      "critical": 4,
      "high": 3,
      "medium": 2,
      "low": 1
    }
  }'
);

-- 停止フェーズの現在状態
INSERT INTO system_settings (key, value) VALUES (
  'stop_the_line_status',
  '{
    "phase": "normal",
    "score": 0,
    "triggered_at": null,
    "trigger_reason": null
  }'
);
```

### stop_the_line_history テーブル（停止履歴）

```sql
CREATE TABLE stop_the_line_history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phase        VARCHAR(20) NOT NULL,   -- 'warning' / 'stopped' / 'resolved'
  score        FLOAT       NOT NULL,
  trigger_reason TEXT,                 -- "critical: 1件, score: 12"
  entered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);
```

---

## 5. API 設計

| エンドポイント | 説明 |
|-------------|------|
| `GET /api/stop-the-line/status` | 現在のフェーズ・スコアを返す |
| `GET /api/stop-the-line/config` | 閾値設定を返す |
| `PATCH /api/stop-the-line/config` | 閾値設定を更新（Settings ページから） |
| `POST /api/stop-the-line/resolve` | 手動で停止フェーズを解除 |
| `GET /api/stop-the-line/history` | 発動履歴一覧 |

バグ作成・更新時（`POST /api/bugs`、`PATCH /api/bugs/{id}`）の内部で閾値チェックを実行し、`stop_the_line_status` を更新する。

---

## 6. UI 設計

### ダッシュボードバナー

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 開発停止フェーズ                                           │
│ Critical バグ 2件・スコア 14/10 超過 — バグ修正を優先してください │
│                                      [詳細を見る] [手動解除]  │
└─────────────────────────────────────────────────────────────┘
```

⚠️ 警告フェーズ（80%）はオレンジ色で表示。

### Settings ページ（閾値設定）

```
┌── Stop the Line 設定 ────────────────────────┐
│ 有効 / 無効                    [ON]           │
│ 集計期間                       7 日           │
│ スコア閾値                     10             │
│ Critical 即停止                ON (1件)       │
│ Severity 重み                                 │
│   critical: 4  high: 3  medium: 2  low: 1    │
└──────────────────────────────────────────────┘
```

### 停止履歴カード（Analytics ページ）

| 発動日時 | 解除日時 | 停止期間 | トリガー | 削減バグ数 |
|---------|---------|---------|---------|----------|
| 2026-03-10 | 2026-03-13 | 3日 | critical 1件, score 14 | -6件 |

---

## 7. 実装フェーズ

| フェーズ | 内容 | 優先度 |
|--------|------|--------|
| v1 | system_settings テーブル + 閾値計算 API + ダッシュボードバナー + Slack 通知 | P1 |
| v2 | Settings ページで閾値カスタマイズ + 警告ダイアログ（操作時） | P2 |
| v3 | 停止履歴 + Analytics への統計追加 | P2 |
| v4 | GitHub Issues 連携（停止中は新 Issue 作成時に Vigil-stop ラベルを自動付与） | P3 |

---

## 8. 今後の検討事項

- **チーム合意の仕組み**: ツールで強制するだけでなく、「なぜ止まっているか」をチームが理解できるダッシュボードリンクを Slack 通知に含める
- **誤検知対策**: 一時的なスパイク（リリース直後など）で誤発動しないよう、「X 日間連続で閾値超過」などのデバウンス設定も将来追加を検討
- **Blacksmith 等の類似ツールとの差別化**: Vigil の強みは「バグの実態データと同じ場所で判定が走る」こと。外部 CI ツールとの連携より、チームの日常的なバグ管理フローに自然に組み込まれている点が価値
