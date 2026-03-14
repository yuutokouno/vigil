# backend/app/connectors/slack/client.py
import logging

import httpx

logger = logging.getLogger(__name__)

SLACK_API = "https://slack.com/api"


class SlackClient:
    def __init__(self, bot_token: str) -> None:
        self._headers = {"Authorization": f"Bearer {bot_token}"}

    async def get_message(self, channel: str, ts: str) -> dict[str, object]:
        """Fetch a single message from conversations.history.

        Returns an empty dict if the message cannot be retrieved (HTTP error or Slack API error).
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{SLACK_API}/conversations.history",
                    headers=self._headers,
                    params={"channel": channel, "latest": ts, "inclusive": "true", "limit": "1"},
                )
                resp.raise_for_status()
                data = resp.json()
                if not data.get("ok"):
                    logger.warning(
                        "Slack conversations.history returned ok=false for channel=%s ts=%s: %s",
                        channel,
                        ts,
                        data.get("error"),
                    )
                    return {}
                messages = data.get("messages", [])
                return messages[0] if messages else {}
        except httpx.HTTPError as exc:
            logger.warning("Slack get_message failed for channel=%s ts=%s: %s", channel, ts, exc)
            return {}

    async def get_user_name(self, user_id: str) -> str:
        """Resolve a Slack user ID to a display name.

        Returns "unknown" on any API or transport failure.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{SLACK_API}/users.info",
                    headers=self._headers,
                    params={"user": user_id},
                )
                resp.raise_for_status()
                data = resp.json()
                if not data.get("ok"):
                    logger.warning(
                        "Slack users.info returned ok=false for user=%s: %s",
                        user_id,
                        data.get("error"),
                    )
                    return "unknown"
                user = data["user"]
                return user.get("real_name") or user.get("name", "unknown")
        except httpx.HTTPError as exc:
            logger.warning("Slack get_user_name failed for user=%s: %s", user_id, exc)
            return "unknown"

    async def post_thread_message(self, channel: str, thread_ts: str, text: str) -> None:
        """Post a reply to a Slack thread. Raises httpx.HTTPError on failure."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{SLACK_API}/chat.postMessage",
                headers=self._headers,
                json={"channel": channel, "thread_ts": thread_ts, "text": text},
            )
            resp.raise_for_status()

    async def test_auth(self) -> bool:
        """Return True if the bot token is valid, False on any error."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{SLACK_API}/auth.test", headers=self._headers)
                resp.raise_for_status()
                return resp.json().get("ok", False)
        except httpx.HTTPError as exc:
            logger.warning("Slack test_auth failed: %s", exc)
            return False

    async def list_channels(self) -> list[dict[str, str]]:
        """Return a list of accessible channels. Returns an empty list on failure."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{SLACK_API}/conversations.list",
                    headers=self._headers,
                    params={"limit": "200", "types": "public_channel,private_channel"},
                )
                resp.raise_for_status()
                data = resp.json()
                if not data.get("ok"):
                    logger.warning(
                        "Slack conversations.list returned ok=false: %s", data.get("error")
                    )
                    return []
                return [{"id": c["id"], "name": c["name"]} for c in data.get("channels", [])]
        except httpx.HTTPError as exc:
            logger.warning("Slack list_channels failed: %s", exc)
            return []
