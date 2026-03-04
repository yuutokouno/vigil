# backend/app/connectors/slack/handler.py
from fastapi import Request

from app.connectors.base import ConnectorABC
from app.connectors.slack.client import SlackClient
from app.connectors.slack.verify import verify_slack_signature
from app.domain.schemas import BugCreate, Priority, Severity, Source


class SlackConnector(ConnectorABC):
    def __init__(self, bot_token: str, signing_secret: str) -> None:
        self.client = SlackClient(bot_token)
        self._signing_secret = signing_secret

    async def verify_request(self, request: Request, body: bytes) -> bool:
        timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
        signature = request.headers.get("X-Slack-Signature", "")
        return verify_slack_signature(self._signing_secret, timestamp, body, signature)

    async def should_process(self, event_data: dict, trigger_rules: dict) -> bool:
        channels = trigger_rules.get("channels", [])
        reactions = trigger_rules.get("reactions", [])
        keywords = trigger_rules.get("keywords", [])

        event_type = event_data.get("type", "")

        if event_type == "reaction_added":
            channel = event_data.get("item", {}).get("channel", "")
            if channels and channel not in channels:
                return False
            return event_data.get("reaction", "") in reactions

        if event_type == "message":
            channel = event_data.get("channel", "")
            if channels and channel not in channels:
                return False
            text = event_data.get("text", "")
            return any(kw in text for kw in keywords)

        return False

    async def transform(self, event_data: dict, field_mappings: list[dict]) -> BugCreate:
        text = str(event_data.get("text", ""))
        user = str(event_data.get("user", ""))
        channel = str(event_data.get("channel", ""))
        ts = str(event_data.get("ts", ""))

        user_name = await self.client.get_user_name(user) if user else "unknown"
        slack_url = f"https://slack.com/archives/{channel}/p{ts.replace('.', '')}"

        # Apply field mappings if provided; otherwise use defaults
        title = text[:100].split("\n")[0] if text else "Slack Bug Report"
        description = text
        reported_by = user_name

        for mapping in field_mappings:
            src = mapping.get("from", "")
            dst = mapping.get("to", "")
            if src == "message.text_title":
                title = text[:100].split("\n")[0]
            elif src == "message.text" and dst == "description":
                description = text
            elif src == "user.real_name" and dst == "reported_by":
                reported_by = user_name

        return BugCreate(
            title=title,
            description=description,
            reported_by=reported_by,
            source=Source.SLACK,
            severity=Severity.MEDIUM,
            priority=Priority.P2,
            external_ref=slack_url,
        )

    async def test_connection(self, credentials: dict) -> bool:
        client = SlackClient(credentials.get("bot_token", ""))
        return await client.test_auth()

    async def fetch_schema(self, credentials: dict) -> list[dict]:
        return [
            {"key": "message.text_title", "label": "メッセージ (先頭100文字 / タイトル用)"},
            {"key": "message.text", "label": "メッセージ全文"},
            {"key": "user.real_name", "label": "投稿者名"},
            {"key": "channel.name", "label": "チャンネル名"},
        ]
