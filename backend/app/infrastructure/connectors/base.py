# backend/app/connectors/base.py
from abc import ABC, abstractmethod

from fastapi import Request

from app.domain.schemas import BugCreate


class ConnectorABC(ABC):
    """Abstract base class for all integration connectors.

    Each connector handles one external service (Slack, HubSpot, Notion, etc.)
    and implements: request verification, trigger rule evaluation, data transformation,
    connection testing, and schema discovery.
    """

    @abstractmethod
    async def verify_request(self, request: Request, body: bytes) -> bool:
        """Verify inbound request signature to prevent spoofing.

        Args:
            request: The FastAPI request object (for header access).
            body: The raw request body bytes (for signature computation).

        Returns:
            True if the request is authentic, False otherwise.
        """
        ...

    @abstractmethod
    async def should_process(self, event_data: dict, trigger_rules: dict) -> bool:
        """Evaluate trigger rules to decide whether to create a bug.

        Args:
            event_data: Parsed event payload from the external service.
            trigger_rules: Configured rules from the integration (channel filters, keywords, etc.).

        Returns:
            True if the event matches the rules and should be processed.
        """
        ...

    @abstractmethod
    async def transform(self, event_data: dict, field_mappings: list[dict]) -> BugCreate:
        """Map external event data to a BugCreate schema.

        Args:
            event_data: Parsed event payload from the external service.
            field_mappings: Configured field mapping pairs from the integration.

        Returns:
            A BugCreate instance ready to be passed to the bug usecase.
        """
        ...

    @abstractmethod
    async def test_connection(self, credentials: dict) -> bool:
        """Validate credentials by making a lightweight API call.

        Args:
            credentials: Decrypted credentials dict for this connector.

        Returns:
            True if credentials are valid and the service is reachable.
        """
        ...

    @abstractmethod
    async def fetch_schema(self, credentials: dict) -> list[dict]:
        """Return available source fields for the field mapping UI.

        Args:
            credentials: Decrypted credentials dict for this connector.

        Returns:
            List of dicts with keys 'key' (field identifier) and 'label' (display name).
            Example: [{"key": "message.text", "label": "メッセージ本文"}, ...]
        """
        ...
