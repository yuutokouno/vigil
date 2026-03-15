from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://vigil:vigil@db:5432/vigil"
    cors_origins: str = "http://localhost:3000"
    github_client_id: str = ""
    github_client_secret: str = ""
    # Required: set JWT_SECRET env var. Generate with: openssl rand -hex 32
    jwt_secret: str = Field(..., description="JWT signing secret — must be set via JWT_SECRET env var")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours
    frontend_url: str = "http://localhost:3000"
    # Required: set ENCRYPTION_KEY env var. Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    encryption_key: str = Field(..., description="Fernet encryption key — must be set via ENCRYPTION_KEY env var")
    # Required for OAuth CSRF protection: set SESSION_SECRET env var. Generate with: openssl rand -hex 32
    session_secret: str = Field(..., description="Session secret for OAuth state — must be set via SESSION_SECRET env var")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
