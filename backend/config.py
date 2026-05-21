from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nexuside"

    # Redis (optional — leave empty to disable)
    REDIS_URL: str = ""

    # LLM — vLLM (OpenAI-compatible endpoint)
    VLLM_URL: str = "http://localhost:8000/v1"
    VLLM_MODEL: str = "Qwen/Qwen3-35B-A3B"
    VLLM_API_KEY: str = ""

    # LLM — Ollama (optional)
    OLLAMA_URL: str = ""

    # LLM Provider: "vllm" or "ollama"
    LLM_PROVIDER: str = "vllm"

    # Vector DB (optional)
    QDRANT_URL: str = ""
    QDRANT_COLLECTION: str = "nexus_code"

    # Auth
    JWT_SECRET: str = "nexus-ide-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — comma-separated origins, use * to allow all
    CORS_ORIGINS: str = "*"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # App
    APP_NAME: str = "NexusIDE"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
