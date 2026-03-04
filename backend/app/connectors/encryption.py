# backend/app/connectors/encryption.py
import json
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


class CredentialDecryptionError(Exception):
    """Raised when stored credentials cannot be decrypted or deserialized."""


@lru_cache(maxsize=1)
def _get_fernet() -> Fernet:
    """Return a cached Fernet instance built from the configured encryption key."""
    return Fernet(settings.encryption_key.encode())


def encrypt_credentials(credentials: dict) -> bytes:
    """Serialize dict to JSON and encrypt with Fernet."""
    plaintext = json.dumps(credentials).encode()
    return _get_fernet().encrypt(plaintext)


def decrypt_credentials(encrypted: bytes) -> dict:
    """Decrypt Fernet-encrypted bytes and deserialize JSON.

    Raises:
        CredentialDecryptionError: if the ciphertext is invalid or cannot be parsed.
    """
    try:
        plaintext = _get_fernet().decrypt(encrypted)
        return json.loads(plaintext.decode())
    except (InvalidToken, json.JSONDecodeError) as exc:
        raise CredentialDecryptionError("Failed to decrypt credentials") from exc
