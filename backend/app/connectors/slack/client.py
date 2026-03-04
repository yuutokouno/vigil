# backend/app/connectors/slack/client.py
import httpx

SLACK_API = "https://slack.com/api"


class SlackClient:
    def __init__(self, bot_token: str) -> None:
        self._headers = {"Authorization": f"Bearer {bot_token}"}

    async def get_message(self, channel: str, ts: str) -> dict[str, object]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SLACK_API}/conversations.history",
                headers=self._headers,
                params={"channel": channel, "latest": ts, "inclusive": "true", "limit": "1"},
            )
            data = resp.json()
            messages = data.get("messages", [])
            return messages[0] if messages else {}

    async def get_user_name(self, user_id: str) -> str:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SLACK_API}/users.info",
                headers=self._headers,
                params={"user": user_id},
            )
            data = resp.json()
            if data.get("ok"):
                user = data["user"]
                return user.get("real_name") or user.get("name", "unknown")
        return "unknown"

    async def post_thread_message(self, channel: str, thread_ts: str, text: str) -> None:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{SLACK_API}/chat.postMessage",
                headers=self._headers,
                json={"channel": channel, "thread_ts": thread_ts, "text": text},
            )

    async def test_auth(self) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{SLACK_API}/auth.test", headers=self._headers)
            return resp.json().get("ok", False)

    async def list_channels(self) -> list[dict[str, str]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SLACK_API}/conversations.list",
                headers=self._headers,
                params={"limit": "200", "types": "public_channel,private_channel"},
            )
            data = resp.json()
            return [{"id": c["id"], "name": c["name"]} for c in data.get("channels", [])]
