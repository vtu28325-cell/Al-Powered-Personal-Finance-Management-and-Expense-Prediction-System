
import os
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = (
        "AI-Powered Personal Finance Management and Expense Prediction System"
    )

    API_V1_STR: str = "/api/v1"

    # Use a safe local-development fallback.
    # Set a strong SECRET_KEY environment variable in production.
    SECRET_KEY: str = "local-development-only-change-me"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Local development uses SQLite.
    # Render production should provide DATABASE_URL for PostgreSQL.
    DATABASE_URL: str = "sqlite:///./finance.db"

    # CORS origins for local development and deployed Vercel frontend.
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
