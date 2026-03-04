import json

from cryptography.fernet import Fernet

from app.config import settings


def _get_fernet() -> Fernet:
    key = settings.encryption_key.encode()
    return Fernet(key)


def encrypt_credentials(credentials: dict) -> bytes:
    """Serialize dict to JSON and encrypt with Fernet."""
    plaintext = json.dumps(credentials).encode()
    return _get_fernet().encrypt(plaintext)


def decrypt_credentials(encrypted: bytes) -> dict:
    """Decrypt Fernet-encrypted bytes and deserialize JSON."""
    plaintext = _get_fernet().decrypt(encrypted)
    return json.loads(plaintext.decode())
