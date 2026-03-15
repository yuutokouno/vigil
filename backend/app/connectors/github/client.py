"""GitHub API client for outbound calls (labels, comments)."""
import logging

import httpx

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"


class GitHubClient:
    """Minimal GitHub REST API client.

    Requires a Personal Access Token (PAT) or GitHub App installation token
    with `issues:write` permission.
    """

    def __init__(self, access_token: str) -> None:
        self._headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def _parse_issue_url(self, issue_url: str) -> tuple[str, str, int] | None:
        """Parse GitHub issue URL → (owner, repo, issue_number) or None."""
        # Expected: https://github.com/{owner}/{repo}/issues/{number}
        parts = issue_url.rstrip("/").split("/")
        try:
            if parts[-2] == "issues":
                return parts[-4], parts[-3], int(parts[-1])
        except (IndexError, ValueError):
            pass
        return None

    async def add_label(self, issue_url: str, label: str) -> bool:
        """Add a label to a GitHub issue. Returns True on success."""
        parsed = self._parse_issue_url(issue_url)
        if not parsed:
            logger.warning("Cannot parse GitHub issue URL: %s", issue_url)
            return False
        owner, repo, number = parsed
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues/{number}/labels"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url, json={"labels": [label]}, headers=self._headers, timeout=10
            )
        if resp.status_code not in (200, 201):
            logger.warning(
                "Failed to add label '%s' to %s: %s", label, issue_url, resp.text
            )
            return False
        return True

    async def post_comment(self, issue_url: str, body: str) -> bool:
        """Post a comment to a GitHub issue. Returns True on success."""
        parsed = self._parse_issue_url(issue_url)
        if not parsed:
            return False
        owner, repo, number = parsed
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues/{number}/comments"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url, json={"body": body}, headers=self._headers, timeout=10
            )
        if resp.status_code not in (200, 201):
            logger.warning(
                "Failed to post comment to %s: %s", issue_url, resp.text
            )
            return False
        return True
