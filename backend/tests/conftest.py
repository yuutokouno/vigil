"""Test configuration.

Sets the required environment variables before any app modules are imported
so that pydantic-settings validation succeeds without a real .env file.
"""
import os

from cryptography.fernet import Fernet

# Set required env vars before app modules are imported.
# Values are deterministic test-only secrets that are never deployed.
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-not-used-in-production-x" * 2)
os.environ.setdefault("ENCRYPTION_KEY", Fernet.generate_key().decode())
os.environ.setdefault("SESSION_SECRET", "test-session-secret-not-used-in-production")
