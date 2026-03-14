# backend/app/connectors/slack/verify.py
import hashlib
import hmac
import time


def verify_slack_signature(
    signing_secret: str,
    timestamp: str,
    body: bytes,
    signature: str,
) -> bool:
    """Verify Slack request signature (prevents spoofing).

    Returns False immediately if any required input is missing, if the timestamp
    is outside the 5-minute replay-attack window, or if the HMAC does not match.
    """
    # Reject requests with missing inputs to avoid accidentally passing validation
    # when the integration is misconfigured (e.g., empty signing secret in DB).
    if not signing_secret or not timestamp or not signature:
        return False

    try:
        if abs(time.time() - float(timestamp)) > 300:
            return False  # Reject requests older than 5 minutes (replay attack prevention)
        sig_basestring = f"v0:{timestamp}:{body.decode('utf-8')}"
        expected = "v0=" + hmac.new(
            signing_secret.encode(),
            sig_basestring.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    except (ValueError, UnicodeDecodeError, AttributeError):
        return False
