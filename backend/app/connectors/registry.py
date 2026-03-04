# backend/app/connectors/registry.py
from app.connectors.base import ConnectorABC

_registry: dict[str, ConnectorABC] = {}


def register_connector(source_type: str, connector: ConnectorABC) -> None:
    """Register a connector instance for the given source type.

    Args:
        source_type: Identifier for the service (e.g. 'slack', 'hubspot', 'notion').
        connector: An instance of a ConnectorABC subclass.
    """
    _registry[source_type] = connector


def get_connector(source_type: str) -> ConnectorABC | None:
    """Retrieve the registered connector for the given source type.

    Returns None if no connector is registered for that source type.
    """
    return _registry.get(source_type)


def list_registered() -> list[str]:
    """Return a list of all registered source type identifiers."""
    return list(_registry.keys())
