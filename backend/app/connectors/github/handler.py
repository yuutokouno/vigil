"""GitHub webhook event handler.

Handles:
- pull_request (opened/synchronize/closed+merged): link PR to bug, transition status
- issues (opened): create Vigil bug from GitHub Issue
- issues (labeled with 'scenario-test'): stub for #14 (requires test_scenarios table)
"""
import hashlib
import hmac
import logging
import re

logger = logging.getLogger(__name__)

# Matches VIGIL-{number} pattern in PR title/body, case-insensitive
_VIGIL_ID_RE = re.compile(r"VIGIL-(\d+)", re.IGNORECASE)


def verify_signature(payload: bytes, signature_header: str | None, secret: str) -> bool:
    """Verify GitHub webhook HMAC-SHA256 signature.

    Expected header value: 'sha256=<hex_digest>'
    """
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def extract_vigil_numbers(text: str) -> list[int]:
    """Extract all VIGIL-{n} bug numbers from a string."""
    return [int(m) for m in _VIGIL_ID_RE.findall(text or "")]


def parse_pr_event(payload: dict) -> dict | None:
    """Parse a pull_request webhook payload.

    Returns a dict with:
      - action: str
      - pr_url: str
      - bug_numbers: list[int]
      - merged: bool
    or None if not actionable.
    """
    action = payload.get("action")
    if action not in ("opened", "synchronize", "closed"):
        return None
    pr = payload.get("pull_request", {})
    title = pr.get("title", "")
    body = pr.get("body", "") or ""
    pr_url = pr.get("html_url", "")
    merged = action == "closed" and pr.get("merged", False)
    bug_numbers = extract_vigil_numbers(title + " " + body)
    if not bug_numbers:
        return None
    return {
        "action": action,
        "pr_url": pr_url,
        "bug_numbers": bug_numbers,
        "merged": merged,
    }


def parse_issue_event(payload: dict) -> dict | None:
    """Parse an issues webhook payload for inbound bug creation.

    Returns a dict with:
      - action: str
      - title: str
      - body: str | None
      - issue_url: str
      - issue_number: int
      - labels: list[str]
    or None if not actionable (e.g. action is not 'opened').
    """
    action = payload.get("action")
    if action not in ("opened", "labeled"):
        return None
    issue = payload.get("issue", {})
    labels = [lbl.get("name", "") for lbl in issue.get("labels", [])]
    return {
        "action": action,
        "title": issue.get("title", ""),
        "body": issue.get("body"),
        "issue_url": issue.get("html_url", ""),
        "issue_number": issue.get("number", 0),
        "labels": labels,
    }
