# Vigil Phase 2 — 外部サービス連携 設計書

## 概要

Phase 1（手動バグ登録・ダッシュボード・ステータス管理）が完成した前提で、
Slack・HubSpot・（将来）Notion からバグ情報を自動取り込みする機能を追加する。

### 設計思想：コネクター型アーキテクチャ

Phase 1 の設計書では「リポジトリを差し替えて保存先を Notion に変える」アプローチだったが、
実際の運用ニーズに合わせて **Vigil を中心に据え、各サービスから情報を吸い上げる** 方式に変更する。

```
                          ┌──────────────┐
  Slack ──── Webhook ────→│              │
                          │    Vigil     │──→ バグチケット自動作成
  HubSpot ── Webhook ────→│  (FastAPI)   │
                          │              │──→ ダッシュボードに即反映
  Notion ─── (将来) ─────→│              │
                          └──────────────┘
```

各コネクターに共通する要素:
- **認証情報** — APIキー / トークン（環境変数で管理）
- **トリガールール** — キーワード・リアクション・チャンネル等（DBで管理）
- **変換ロジック** — 外部データ → Vigil の BugCreate へのマッピング

### フィルタリング方針：ハイブリッド

外部サービス側とVigil側の2段階でフィルタリングする。

| 段階 | 担当 | 内容 | 例 |
|------|------|------|-----|
| 1段目（粗いフィルタ） | 外部サービス側 | チャンネル・イベント種別 | Slack: 特定チャンネルの `reaction_added` のみ受信 |
| 2段目（細かいフィルタ） | Vigil 側 | キーワードマッチ・重複排除 | メッセージに「バグ」「エラー」を含むか判定 |

メリット:
- 不要なイベントの大半を外部サービス側でカットし、通信量を抑える
- キーワード等の日常的なルール変更は Vigil 側（DB）で完結、デプロイ不要
- 各サービスの設定が一箇所にバラけない

---

## 実装優先順位

| 順序 | サービス | 理由 |
|------|---------|------|
| 1 | **Slack** | チーム内バグ報告の主要チャネル。Events API で実装 |
| 2 | **HubSpot** | 顧客からのバグ報告を取り込む。Webhook で実装 |
| 3 | Notion | 既存ドキュメントからの取り込み。API ポーリングで実装（将来） |

---

## ディレクトリ構成（追加分）

```
backend/app/
├── connectors/                     # ← Phase 2 で新規追加
│   ├── __init__.py
│   ├── base.py                     #   ConnectorABC / TriggerRule 定義
│   ├── registry.py                 #   コネクター登録・取得
│   ├── slack/
│   │   ├── __init__.py
│   │   ├── handler.py              #   Slack イベント処理 + Bug 変換
│   │   ├── client.py               #   Slack API クライアント（メッセージ取得等）
│   │   └── verify.py               #   リクエスト署名検証
│   └── hubspot/
│       ├── __init__.py
│       ├── handler.py              #   HubSpot Webhook 処理 + Bug 変換
│       └── verify.py               #   Webhook 署名検証
│
├── domain/
│   ├── models.py                   # ← connector_configs テーブル追加
│   └── schemas.py                  # ← TriggerRule / ConnectorConfig スキーマ追加
│
├── presentation/
│   ├── bugs.py                     #   既存
│   └── webhooks.py                 # ← Webhook 受信エンドポイント追加
│
└── usecase/
    ├── bug_usecase.py              #   既存
    └── connector_usecase.py        # ← コネクター管理ロジック追加
```

---

## データモデル（追加分）

### connector_configs テーブル

コネクターのトリガールールを DB で管理する。
（APIキー等の認証情報は環境変数で管理し、DB には入れない）

```sql
CREATE TABLE connector_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(20) NOT NULL,           -- 'slack' | 'hubspot' | 'notion'
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- フィルタリングルール（JSON）
    -- Slack例:  {"channels": ["C01234"], "reactions": ["bug"], "keywords": ["バグ", "エラー", "不具合"]}
    -- HubSpot例: {"pipeline_id": "...", "ticket_status": "new", "keywords": ["bug", "defect"]}
    trigger_rules JSONB NOT NULL DEFAULT '{}',
    
    -- メタ情報
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サービスごとに1レコード
CREATE UNIQUE INDEX idx_connector_configs_service ON connector_configs(service);
```

### bugs テーブルへの変更

既存の `source` フィールドと外部連携フィールドを活用する（スキーマ変更なし）。

```
source = 'slack'           → slack_message_url にメッセージURL
source = 'hubspot'         → （hubspot_ticket_url フィールドを追加検討）
source = 'manual'          → 既存の手動登録
```

**追加検討フィールド:**
```sql
ALTER TABLE bugs ADD COLUMN hubspot_ticket_id VARCHAR(100);
ALTER TABLE bugs ADD COLUMN external_ref VARCHAR(500);  -- 汎用外部参照
```

---

## コネクター基盤設計

### base.py — 抽象コネクター

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel
from app.domain.schemas import BugCreate

class TriggerRuleConfig(BaseModel):
    """トリガールール（サービスごとにフィールドが異なる）"""
    keywords: list[str] = []

class SlackTriggerRules(TriggerRuleConfig):
    channels: list[str] = []        # 監視するチャンネルID
    reactions: list[str] = ["bug"]  # トリガーのリアクション名

class HubSpotTriggerRules(TriggerRuleConfig):
    pipeline_id: str | None = None
    ticket_status: list[str] = ["new"]

class ConnectorABC(ABC):
    """各サービスのコネクター共通インターフェース"""

    @abstractmethod
    async def verify_request(self, request) -> bool:
        """リクエストの署名を検証する（なりすまし防止）"""
        ...

    @abstractmethod
    async def should_process(self, event_data: dict) -> bool:
        """トリガールールに基づき、処理すべきイベントか判定する"""
        ...

    @abstractmethod
    async def transform(self, event_data: dict) -> BugCreate:
        """外部データを BugCreate スキーマに変換する"""
        ...

    @abstractmethod
    async def test_connection(self) -> bool:
        """接続テスト（APIキーの有効性確認等）"""
        ...
```

### registry.py — コネクター登録

```python
from app.connectors.base import ConnectorABC

class ConnectorRegistry:
    """コネクターの登録・取得を管理"""

    def __init__(self):
        self._connectors: dict[str, ConnectorABC] = {}

    def register(self, service: str, connector: ConnectorABC):
        self._connectors[service] = connector

    def get(self, service: str) -> ConnectorABC | None:
        return self._connectors.get(service)

    def list_services(self) -> list[str]:
        return list(self._connectors.keys())


# アプリ起動時に登録
# registry = ConnectorRegistry()
# registry.register("slack", SlackConnector(...))
# registry.register("hubspot", HubSpotConnector(...))
```

---

## Slack 連携 詳細設計

### 前提: Slack App の作成

1. https://api.slack.com/apps → 「Create New App」→「From scratch」
2. App名: `Vigil`、ワークスペース: archaive のワークスペースを選択
3. 以下の情報を取得して環境変数に設定:
   - **Bot User OAuth Token** (`xoxb-...`) → `SLACK_BOT_TOKEN`
   - **Signing Secret** → `SLACK_SIGNING_SECRET`

### Slack App の権限設定 (OAuth & Permissions)

Bot Token Scopes に以下を追加:

| スコープ | 用途 |
|---------|------|
| `channels:history` | パブリックチャンネルのメッセージ読み取り |
| `reactions:read` | リアクションイベントの受信 |
| `users:read` | ユーザー名の取得（reported_by に使用） |
| `chat:write` | （任意）チケット作成時にスレッドへ確認メッセージを投稿 |

### Event Subscriptions 設定

1. 「Event Subscriptions」を ON
2. Request URL を設定（後述の開発フローを参照）:
   - 開発: `https://<ngrok-url>/api/webhooks/slack`
   - 本番: `https://<railway-url>/api/webhooks/slack`
3. Subscribe to bot events:
   - `reaction_added` — リアクションが付いたとき
   - `message.channels` — チャンネルへのメッセージ投稿（キーワード検知用）

### Slack イベント処理フロー

```
Slack → POST /api/webhooks/slack
         │
         ├─ type: "url_verification"
         │   → challenge レスポンスを返す（初回設定時のみ）
         │
         ├─ 署名検証（SLACK_SIGNING_SECRET）
         │   → 失敗: 403
         │
         ├─ event.type: "reaction_added"
         │   ├─ リアクション名がルールに一致するか？（例: 🐛）
         │   ├─ チャンネルが監視対象か？
         │   ├─ YES → conversations.history で元メッセージを取得
         │   │       → キーワードマッチ判定（2段目フィルタ）
         │   │       → 重複チェック（slack_message_url で既存チケットを検索）
         │   │       → BugCreate に変換 → bug_usecase.create()
         │   │       → （任意）スレッドに「✅ Vigil チケット作成済み」を投稿
         │   └─ NO → 無視
         │
         └─ event.type: "message"
             ├─ チャンネルが監視対象か？
             ├─ キーワードマッチ判定
             ├─ YES → BugCreate に変換 → bug_usecase.create()
             └─ NO → 無視
```

### Slack メッセージ → BugCreate 変換ルール

```python
async def transform(self, event_data: dict) -> BugCreate:
    message = event_data["message"]
    user = await self.client.get_user_name(event_data["user"])

    return BugCreate(
        title=self._extract_title(message["text"]),  # 先頭100文字 or 1行目
        description=message["text"],
        reported_by=user,
        source=Source.SLACK,
        severity=Severity.MEDIUM,      # デフォルト（後から手動変更）
        priority=Priority.P2,          # デフォルト
        slack_message_url=self._build_message_url(
            channel=event_data["channel"],
            ts=message["ts"]
        ),
    )
```

### handler.py 実装イメージ

```python
import hashlib
import hmac
import time

from app.connectors.base import ConnectorABC, SlackTriggerRules
from app.domain.schemas import BugCreate, Source, Severity, Priority
from app.connectors.slack.client import SlackClient


class SlackConnector(ConnectorABC):
    def __init__(
        self,
        bot_token: str,
        signing_secret: str,
        trigger_rules: SlackTriggerRules,
    ):
        self.client = SlackClient(bot_token)
        self.signing_secret = signing_secret
        self.rules = trigger_rules

    async def verify_request(self, timestamp: str, body: bytes, signature: str) -> bool:
        """Slack リクエスト署名検証"""
        if abs(time.time() - float(timestamp)) > 300:
            return False  # 5分以上前のリクエストは拒否（リプレイ攻撃防止）

        sig_basestring = f"v0:{timestamp}:{body.decode()}"
        my_signature = "v0=" + hmac.new(
            self.signing_secret.encode(),
            sig_basestring.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(my_signature, signature)

    async def should_process(self, event: dict) -> bool:
        """トリガールール判定"""
        # チャンネルフィルタ
        if self.rules.channels and event.get("channel") not in self.rules.channels:
            return False

        # リアクションイベントの場合
        if event.get("type") == "reaction_added":
            return event.get("reaction") in self.rules.reactions

        # メッセージイベントの場合：キーワードマッチ
        text = event.get("text", "")
        return any(kw in text for kw in self.rules.keywords)

    async def transform(self, event_data: dict) -> BugCreate:
        """Slack メッセージ → BugCreate"""
        text = event_data.get("text", "")
        user_name = await self.client.get_user_name(event_data.get("user", ""))
        channel = event_data.get("channel", "")
        ts = event_data.get("ts", "")

        return BugCreate(
            title=text[:100].split("\n")[0],
            description=text,
            reported_by=user_name,
            source=Source.SLACK,
            severity=Severity.MEDIUM,
            priority=Priority.P2,
            slack_message_url=f"https://slack.com/archives/{channel}/p{ts.replace('.', '')}",
        )

    async def test_connection(self) -> bool:
        """Slack API 接続テスト"""
        return await self.client.test_auth()
```

### client.py 実装イメージ

```python
import httpx

class SlackClient:
    BASE_URL = "https://slack.com/api"

    def __init__(self, bot_token: str):
        self.token = bot_token
        self.headers = {"Authorization": f"Bearer {bot_token}"}

    async def get_message(self, channel: str, ts: str) -> dict:
        """conversations.history でメッセージ本文を取得"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/conversations.history",
                headers=self.headers,
                params={"channel": channel, "latest": ts, "inclusive": True, "limit": 1},
            )
            data = resp.json()
            return data["messages"][0] if data.get("ok") else {}

    async def get_user_name(self, user_id: str) -> str:
        """users.info でユーザー表示名を取得"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/users.info",
                headers=self.headers,
                params={"user": user_id},
            )
            data = resp.json()
            if data.get("ok"):
                user = data["user"]
                return user.get("real_name") or user.get("name", "unknown")
            return "unknown"

    async def post_thread_message(self, channel: str, thread_ts: str, text: str):
        """スレッドに確認メッセージを投稿"""
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.BASE_URL}/chat.postMessage",
                headers=self.headers,
                json={"channel": channel, "thread_ts": thread_ts, "text": text},
            )

    async def test_auth(self) -> bool:
        """auth.test で接続確認"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/auth.test",
                headers=self.headers,
            )
            return resp.json().get("ok", False)
```

---

## HubSpot 連携 詳細設計

### 前提

HubSpot のチケット機能を使い、顧客からの問い合わせのうち
バグに関するものを Vigil に自動取り込みする。

### 連携方式

HubSpot にはワークフロー機能があり、「チケットが作成されたら Webhook を送信する」
というアクションを設定できる。これを使い、Vigil のエンドポイントにデータを送る。

```
顧客 → HubSpot チケット作成
         → HubSpot ワークフロー発火
            → POST /api/webhooks/hubspot（Vigil）
               → キーワード判定 → バグチケット作成
```

### HubSpot 側の設定

1. HubSpot → 設定 → Private App を作成
2. 以下のスコープを付与:
   - `crm.objects.contacts.read`（連絡先情報）
   - `tickets`（チケット読み取り）
3. Private App Token を取得 → `HUBSPOT_ACCESS_TOKEN`
4. ワークフロー:
   - トリガー: 「チケットが作成されたとき」
   - 条件: パイプライン・ステータスでフィルタ（1段目フィルタ）
   - アクション: 「Webhook を送信」→ Vigil の URL を設定

### HubSpot Webhook → BugCreate 変換

```python
class HubSpotConnector(ConnectorABC):
    async def transform(self, event_data: dict) -> BugCreate:
        ticket = event_data.get("properties", {})

        return BugCreate(
            title=ticket.get("subject", "HubSpot Ticket"),
            description=ticket.get("content", ""),
            reported_by=ticket.get("reporter_name", "顧客"),
            source=Source.HUBSPOT,
            severity=self._map_priority(ticket.get("hs_ticket_priority")),
            priority=Priority.P2,
            # hubspot_ticket_id は bugs テーブルに追加する場合
        )

    def _map_priority(self, hs_priority: str | None) -> Severity:
        """HubSpot の priority を Vigil の severity にマッピング"""
        mapping = {
            "HIGH": Severity.HIGH,
            "MEDIUM": Severity.MEDIUM,
            "LOW": Severity.LOW,
        }
        return mapping.get(hs_priority, Severity.MEDIUM)
```

---

## Webhook エンドポイント

### presentation/webhooks.py

```python
from fastapi import APIRouter, Request, HTTPException
from app.connectors.registry import ConnectorRegistry
from app.usecase.bug_usecase import BugUseCase

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/slack")
async def slack_webhook(
    request: Request,
    registry: ConnectorRegistry = Depends(get_registry),
    usecase: BugUseCase = Depends(get_usecase),
):
    body = await request.body()
    json_body = await request.json()

    # 1. URL verification（Slack 初回設定時）
    if json_body.get("type") == "url_verification":
        return {"challenge": json_body["challenge"]}

    # 2. 署名検証
    connector = registry.get("slack")
    timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
    signature = request.headers.get("X-Slack-Signature", "")
    if not await connector.verify_request(timestamp, body, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")

    # 3. イベント処理
    event = json_body.get("event", {})
    if not await connector.should_process(event):
        return {"ok": True, "action": "skipped"}

    # 4. reaction_added の場合、元メッセージを取得
    if event.get("type") == "reaction_added":
        message = await connector.client.get_message(
            channel=event["item"]["channel"],
            ts=event["item"]["ts"],
        )
        event_data = {**message, "channel": event["item"]["channel"]}
    else:
        event_data = event

    # 5. 重複チェック（同じ Slack メッセージから既にチケットが作られていないか）
    slack_url = connector._build_message_url(event_data)
    existing = await usecase.find_by_slack_url(slack_url)
    if existing:
        return {"ok": True, "action": "duplicate"}

    # 6. 変換 → 作成
    bug_create = await connector.transform(event_data)
    bug = await usecase.create(bug_create)

    # 7. Slack スレッドに確認投稿（任意）
    await connector.client.post_thread_message(
        channel=event_data["channel"],
        thread_ts=event_data.get("ts", ""),
        text=f"✅ Vigil にバグチケットを作成しました: {bug.title}",
    )

    return {"ok": True, "action": "created", "bug_id": str(bug.id)}


@router.post("/hubspot")
async def hubspot_webhook(
    request: Request,
    registry: ConnectorRegistry = Depends(get_registry),
    usecase: BugUseCase = Depends(get_usecase),
):
    json_body = await request.json()

    connector = registry.get("hubspot")

    # 1. 署名検証
    if not await connector.verify_request(request):
        raise HTTPException(status_code=403, detail="Invalid signature")

    # 2. トリガールール判定
    if not await connector.should_process(json_body):
        return {"ok": True, "action": "skipped"}

    # 3. 変換 → 作成
    bug_create = await connector.transform(json_body)
    bug = await usecase.create(bug_create)

    return {"ok": True, "action": "created", "bug_id": str(bug.id)}
```

---

## 環境変数（追加分）

```bash
# === Slack ===
SLACK_BOT_TOKEN=xoxb-xxxx-xxxx-xxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxxxxxx

# === HubSpot ===
HUBSPOT_ACCESS_TOKEN=pat-xx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# === 開発用 ===
# ngrok の URL（ローカル開発時に Slack Webhook を受けるため）
# ※ ngrok 起動時に毎回変わる（固定URLは有料プラン）
NGROK_URL=https://xxxx-xxxx.ngrok-free.app
```

`.env.example` に追記:
```bash
# Phase 2: Connectors
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
HUBSPOT_ACCESS_TOKEN=
```

---

## 開発フロー（ngrok + ローカル）

### なぜ ngrok が必要か

Slack の Events API は、イベント発生時に Vigil の URL へ POST リクエストを送る。
ローカルの `localhost:8000` は外部からアクセスできないため、
ngrok を使ってローカルサーバーに一時的な公開 URL を付与する。

```
Slack → https://xxxx.ngrok-free.app/api/webhooks/slack
                    │
                    ▼
            ngrok（トンネル）
                    │
                    ▼
         localhost:8000/api/webhooks/slack
                    │
                    ▼
            Docker (FastAPI)
```

### セットアップ手順

```bash
# 1. ngrok インストール（macOS）
brew install ngrok

# 2. ngrok アカウント作成 & トークン設定
#    https://dashboard.ngrok.com/signup でサインアップ
ngrok config add-authtoken <YOUR_TOKEN>

# 3. Docker 環境を起動
docker compose up -d

# 4. ngrok でトンネルを開通（別ターミナルで）
ngrok http 8000

# → 表示される URL（例: https://a1b2-c3d4.ngrok-free.app）を
#   Slack App の Event Subscriptions → Request URL に設定
#   例: https://a1b2-c3d4.ngrok-free.app/api/webhooks/slack
```

### 開発サイクル

```
1. docker compose up -d      ← バックエンド起動
2. ngrok http 8000            ← トンネル開通
3. Slack App に ngrok URL 設定 ← イベント受信開始
4. コード変更                  ← FastAPI --reload で自動反映
5. Slack でテスト投稿          ← 🐛リアクション or キーワード含むメッセージ
6. Vigil ダッシュボードで確認  ← チケットが自動作成されているか
```

**注意:** ngrok 無料プランでは起動のたびに URL が変わる。
その都度 Slack App の Request URL を更新する必要がある。
Railway にデプロイすれば固定 URL になるため、この手間は本番では不要。

---

## Claude Code への実装指示

### Step 7: コネクター基盤

1. `app/connectors/base.py` — `ConnectorABC`, `TriggerRuleConfig` を定義
2. `app/connectors/registry.py` — `ConnectorRegistry` を実装
3. `app/domain/models.py` — `ConnectorConfig` モデルを追加（connector_configs テーブル）
4. `app/domain/schemas.py` — `SlackTriggerRules`, `HubSpotTriggerRules` を追加
5. Alembic マイグレーション作成 & 実行
6. コミット: `feat: add connector base architecture`

### Step 8: Slack 連携

1. `app/connectors/slack/verify.py` — 署名検証ロジック
2. `app/connectors/slack/client.py` — Slack API クライアント（httpx）
3. `app/connectors/slack/handler.py` — `SlackConnector(ConnectorABC)` 実装
4. `app/presentation/webhooks.py` — `/api/webhooks/slack` エンドポイント
5. `app/main.py` — webhooks router を登録、SlackConnector を registry に登録
6. `app/usecase/bug_usecase.py` — `find_by_slack_url()` メソッド追加（重複チェック用）
7. `requirements.txt` — `httpx` 追加
8. ngrok で動作確認
9. コミット: `feat: Slack integration via Events API`

### Step 9: HubSpot 連携

1. `app/connectors/hubspot/handler.py` — `HubSpotConnector(ConnectorABC)` 実装
2. `app/connectors/hubspot/verify.py` — Webhook 署名検証
3. `app/presentation/webhooks.py` — `/api/webhooks/hubspot` エンドポイント追加
4. `app/main.py` — HubSpotConnector を registry に登録
5. 動作確認
6. コミット: `feat: HubSpot integration via Webhook`

### Step 10: 接続テスト & 管理エンドポイント

1. `app/presentation/connectors.py` — コネクター管理 API
   - `GET  /api/connectors` — コネクター一覧（有効/無効状態）
   - `PUT  /api/connectors/{service}/rules` — トリガールール更新
   - `POST /api/connectors/{service}/test` — 接続テスト実行
2. フロントエンドに設定画面を追加（将来）
3. コミット: `feat: connector management API`

---

## 設計上の判断メモ

### 1. なぜリポジトリパターンではなくコネクターパターンか

Phase 1 の設計書では「BugRepository ABC → PostgreSQL / Notion 実装」として
保存先を差し替える設計だった。しかし実際の運用ニーズは
「複数の外部サービスから Vigil に情報を集約する」方向。

- リポジトリパターン: 保存先の抽象化（PostgreSQL ↔ Notion）
- コネクターパターン: 入力元の抽象化（Slack ↔ HubSpot ↔ Notion）

これらは排他ではなく、**リポジトリパターンは Phase 1 のまま維持**しつつ、
入力側にコネクターパターンを追加する形。

### 2. APIキーは環境変数、ルールは DB

- APIキーをDBに入れると暗号化・復号の実装が必要になり、漏洩リスクも上がる
- トリガールール（キーワード等）は運用中に頻繁に変更するため DB 管理が適切
- Phase 1 の小規模チームではこのハイブリッドが最もバランスが良い

### 3. 重複排除の仕組み

同じ Slack メッセージに複数人が 🐛 を付けた場合、チケットが重複作成されないよう
`slack_message_url` で既存チケットを検索する。
HubSpot も同様に、チケットIDで重複チェックする。

### 4. Phase 1 のリポジトリパターンへの影響

`BugRepository` の ABC に `find_by_slack_url()` のようなメソッドを追加するか、
それとも汎用的な `find_by_field(field, value)` にするかは検討が必要。
拡張性を考えると汎用メソッドが良いが、Phase 2 の規模なら専用メソッドでも十分。