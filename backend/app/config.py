from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://vigil:vigil@db:5432/vigil"
    cors_origins: str = "http://localhost:3000"
    github_client_id: str = ""
    github_client_secret: str = ""
    jwt_secret: str = "vigil-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours
    frontend_url: str = "http://localhost:3000"
    encryption_key: str = ""  # Set via ENCRYPTION_KEY env var; generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
