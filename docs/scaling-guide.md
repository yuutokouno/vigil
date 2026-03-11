# Vigil スケーリングガイド

> 作成日: 2026-03-12
> 対象: Vigil を SaaS として成長させる際のインフラ・アーキテクチャ知識

---

## 0. 大前提：スケーリングの優先順位

言語やインフラを変える前に、この順序で解決する。

```
1. DB クエリ最適化・インデックス    ← 無料、効果が一番大きい
2. Redis キャッシュ               ← 安価
3. 非同期ジョブキュー              ← APScheduler → ARQ/Celery
4. DB Read Replica               ← 読み取りを分散
5. PgBouncer 接続プーリング        ← 接続数枯渇を防ぐ
---（ここまでで数万 RPS は捌ける）---
6. 水平スケールアウト              ← ロードバランサー + 複数インスタンス
7. マイクロサービス化 / 言語移行   ← 本当に必要になってから
```

---

## 1. バックエンド言語の選択

### 比較表

| 言語 | 実行速度 | 開発速度 | スケーラビリティ | AI/ML 機能 | 推奨場面 |
|------|---------|---------|--------------|-----------|---------|
| **Python (FastAPI)** | ★★★☆☆ | ★★★★★ | ★★★☆☆ | ★★★★★ | 今の Vigil に最適 |
| **Go** | ★★★★★ | ★★★☆☆ | ★★★★★ | ★★☆☆☆ | 大量 Webhook / 高スループット API |
| **TypeScript (Bun)** | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | フルスタック TS 統一したい場合 |
| **Rust** | ★★★★★ | ★★☆☆☆ | ★★★★★ | ★★☆☆☆ | 超大規模・システム寄り |

### Vigil の結論

**今すぐ言語を変える必要はない。** FastAPI (Python) のまま進める。

Go への移行を検討するのは「月 1,000 社以上が使う SaaS になったとき」で十分。
それより先に DB・キャッシュ・インフラの最適化が先。

---

## 2. データベース最適化

### 2-1. ボトルネックの特定

```sql
-- 遅いクエリを特定する（PostgreSQL）
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 実行計画を見る
EXPLAIN ANALYZE
SELECT * FROM bugs
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 20;
```

`Seq Scan`（フルテーブルスキャン）が出たらインデックス不足。

### 2-2. インデックス設計

```sql
-- Vigil で必要なインデックス
-- よく WHERE 句で使う列に張る
CREATE INDEX idx_bugs_status         ON bugs(status);
CREATE INDEX idx_bugs_severity       ON bugs(severity);
CREATE INDEX idx_bugs_assigned_to    ON bugs(assigned_to);
CREATE INDEX idx_bugs_milestone_id   ON bugs(milestone_id);
CREATE INDEX idx_bugs_created_at     ON bugs(created_at DESC);

-- 複合インデックス（複数条件で絞り込む場合）
CREATE INDEX idx_bugs_status_severity ON bugs(status, severity);

-- テナント分離後（Phase 4）
CREATE INDEX idx_bugs_project_status ON bugs(project_id, status);
```

**インデックスのトレードオフ:**
- 読み取りは速くなる
- 書き込み（INSERT/UPDATE）は少し遅くなる
- データが少ない（数千件）うちはほぼ影響なし

### 2-3. N+1 問題

```python
# NG: N+1（バグ100件 → マイルストーン100回クエリ）
bugs = await session.execute(select(Bug))
for bug in bugs:
    milestone = await session.get(Milestone, bug.milestone_id)  # N回走る

# OK: JOIN で一度に取得
bugs = await session.execute(
    select(Bug).options(selectinload(Bug.milestone))
)
```

### 2-4. Read Replica（読み取り分散）

書き込みは Primary に、読み取り（Analytics など）は Replica に向ける。

```
[FastAPI]
  ├── 書き込み → [PostgreSQL Primary]
  └── 読み取り → [PostgreSQL Replica]
```

Railway では簡単に Read Replica を追加できる。
AWS RDS / Supabase でも同様の設定が可能。

### 2-5. コネクションプーリング（PgBouncer）

FastAPI インスタンスが複数になると DB への接続数が爆発する問題を防ぐ。

```
[FastAPI × 10インスタンス] → [PgBouncer] → [PostgreSQL]
各インスタンスが100接続持とうとしても PgBouncer が20接続に絞る
```

```ini
# pgbouncer.ini
[databases]
vigil = host=db port=5432 dbname=vigil

[pgbouncer]
pool_mode = transaction       # トランザクション単位でプール
max_client_conn = 1000        # クライアント最大接続数
default_pool_size = 20        # DB への実際の接続数
```

---

## 3. キャッシュ戦略（Redis）

### 何をキャッシュするか

| データ | TTL | 理由 |
|--------|-----|------|
| Analytics 集計結果 | 60秒〜5分 | 重い集計を毎回走らせない |
| ワークフローカラム一覧 | 5分 | 変更頻度が低い |
| ユーザー情報（JWT 検証後） | 15分 | DB クエリ削減 |
| バグ一覧（フィルタ済み） | 30秒 | 同じ条件のリクエストが多い |

### キャッシュしてはいけないもの

- バグの詳細（更新頻度が高い・リアルタイム性が必要）
- コメント・チャット（即時反映が必要）
- 認証トークン（セキュリティリスク）

### Python での実装例

```python
import redis.asyncio as redis
import json

redis_client = redis.from_url("redis://localhost:6379")

async def get_analytics(period: str) -> dict:
    cache_key = f"analytics:{period}"

    # キャッシュヒット
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # DB から取得して計算
    result = await compute_analytics(period)

    # 2分キャッシュ
    await redis_client.setex(cache_key, 120, json.dumps(result))
    return result
```

---

## 4. 非同期ジョブキュー

### なぜ必要か

重い処理をリクエストに乗せると UX が悪化する。

```
NG: POST /api/bugs → Slack 通知送信（2秒待たせる） → 200 OK
OK: POST /api/bugs → ジョブキューに追加 → 即座に 202 Accepted
                         ↓
                   Worker が非同期で Slack 通知
```

### 現在（APScheduler）→ 本格スケール時（ARQ）

```python
# ARQ（FastAPI 向けの async ジョブキュー）
import arq

async def send_slack_notification(ctx, bug_id: str, message: str):
    """Worker で実行されるタスク"""
    await slack_client.post_message(message)

# API 側: キューに追加するだけ
async def create_bug(bug: BugCreate, redis: Redis):
    new_bug = await bug_repo.create(bug)
    await redis.enqueue_job("send_slack_notification", new_bug.id, "新規バグ登録")
    return new_bug  # すぐ返す
```

### ジョブキューが必要な処理

- Slack / メール通知
- GitHub API コール
- 外部サービスへの Webhook 送信
- 重いレポート生成・PDF エクスポート
- バッチテスト実行（#T）

---

## 5. ステートレス設計（水平スケールの前提）

「どのインスタンスがリクエストを受けても同じ結果を返せる」状態にする。

### NG パターン（ステートフル）

```python
# サーバーメモリに状態を持つ → スケールアウト不可
app_state = {}  # NG

# ローカルファイルに保存 → 他インスタンスから見えない
with open("/tmp/upload.png", "wb") as f:  # NG
    f.write(file.read())
```

### OK パターン（ステートレス）

```python
# 認証: JWT（現在の Vigil はこれ ✅）
# ファイル: S3 / Cloudflare R2 に保存
import boto3
s3 = boto3.client("s3")
s3.upload_fileobj(file, "vigil-bucket", f"attachments/{bug_id}/{filename}")

# セッション: Redis に保存（必要な場合）
```

### 水平スケールアウト構成

```
[Cloudflare / ALB]
    ├── FastAPI Instance 1  (Railway / ECS)
    ├── FastAPI Instance 2
    └── FastAPI Instance 3
         │
         ├── [PostgreSQL Primary]   ← 書き込み
         ├── [PostgreSQL Replica]   ← 読み取り
         └── [Redis]                ← キャッシュ・キュー・セッション
```

---

## 6. マルチテナント設計

### 3 つのアプローチ

#### Approach 1: 共有 DB（`project_id` フィルタ）← Phase 4 で採用
```sql
SELECT * FROM bugs WHERE project_id = :project_id;
```
- 安価、管理が楽
- 大口顧客のクエリが他テナントに影響する可能性あり
- → Row Level Security (RLS) で防御できる

#### Approach 2: スキーマ分離（PostgreSQL の schema 機能）
```sql
-- テナントごとに schema を作る
SET search_path TO tenant_acme;
SELECT * FROM bugs;  -- tenant_acme.bugs を参照
```
- バックアップ・移行が独立
- 接続数が増える

#### Approach 3: DB インスタンス分離
- 最高の分離・セキュリティ
- コスト大（1社 $50〜70/月）
- 大口企業・コンプライアンス要件がある顧客向け

### Vigil の戦略

```
初期: Approach 1（project_id フィルタ）で多数の小〜中規模チームを1インスタンスで管理
大口顧客: Approach 3（専用 DB インスタンス）を別途提供・月額請求
```

---

## 7. 可観測性（Observability）

スケール後に「どこで遅いか・何が落ちているか」をわかるようにする。

### 3本柱

```
Metrics  → 「何が何回起きたか」（例: リクエスト数、エラー率、レスポンスタイム）
Traces   → 「1リクエストがどこで時間を使ったか」（DB? Redis? 外部 API?）
Logs     → 「何が起きたか」（構造化 JSON で保存する）
```

### 最低限やること

```python
# 1. 構造化ログ（JSON）
import structlog
log = structlog.get_logger()
log.info("bug_created", bug_id=str(bug.id), severity=bug.severity)

# 2. レスポンスタイム計測
import time
from fastapi import Request

@app.middleware("http")
async def add_timing(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = str(duration)
    log.info("request", path=request.url.path, duration=duration, status=response.status_code)
    return response
```

### ツールスタック（コスト順）

| ツール | 用途 | コスト |
|-------|------|--------|
| Sentry | エラー追跡（無料枠あり） | 無料〜 |
| Datadog | Metrics + Traces + Logs 統合 | $15/host〜 |
| Grafana + Prometheus | セルフホスト Metrics | 無料（運用コストあり） |
| OpenTelemetry | トレース標準規格（Datadog/Jaeger に送れる） | 無料 |

---

## 8. インフラ移行ロードマップ

### 現在 → 将来の段階的な移行

```
[Phase A] 開発・検証期  ← 今ここ
  Vercel (Frontend) + Railway (Backend + DB)
  費用: ~$15-30/月
  対応規模: 〜数十チーム

[Phase B] 成長期
  Railway のまま水平スケール + Redis 追加 + Read Replica
  費用: ~$50-100/月
  対応規模: 〜数百チーム

[Phase C] 会社導入期
  AWS ECS Fargate + RDS + ElastiCache (Redis) + S3
  費用: ~$100-200/月（基盤）+ $50-70/社（専用 DB）
  対応規模: 数千チーム、大口顧客に専用インスタンス提供

[Phase D] 大規模 SaaS
  Kubernetes + マルチリージョン + CDN
  言語移行（Go へ）を検討
  費用: $500/月〜
```

---

## 9. セキュリティ（スケール時の追加対策）

```
Rate Limiting    → Cloudflare / nginx で IP ごとのリクエスト数を制限
WAF              → Cloudflare WAF（SQLi / XSS をエッジで遮断）
Secrets 管理     → AWS Secrets Manager / Doppler（.env を本番に置かない）
DB 暗号化        → RDS の暗号化 + `ENCRYPTION_KEY` で credentials を暗号化（現在実装済み ✅）
監査ログ         → 誰がいつ何を変更したか記録（テナント導入時に必須）
```

---

## チェックリスト（スケール前の確認事項）

### Phase 1（デプロイ前）
- [ ] `EXPLAIN ANALYZE` で重いクエリがないか確認
- [ ] 必要なインデックスが張られているか
- [ ] `.env` にシークレットが含まれていないか（`.gitignore` 確認）
- [ ] エラーログが構造化 JSON で出力されているか
- [ ] Sentry（または同等のエラー追跡）を設定したか

### Phase 2（チーム導入時）
- [ ] Redis を追加してセッション・キャッシュを外部化
- [ ] 重い処理（Slack 通知など）をジョブキューに移動
- [ ] PgBouncer でコネクションプーリングを設定
- [ ] ステートレス設計になっているか（ローカルファイル依存がないか）

### Phase 3（会社導入時）
- [ ] Read Replica を追加（Analytics クエリを分離）
- [ ] マルチテナント分離（project_id フィルタ or スキーマ分離）が正しく機能しているか
- [ ] Rate Limiting を設定したか
- [ ] SLA・アップタイム監視を設定したか
