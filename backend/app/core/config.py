"""Application settings, loaded from environment variables (and backend/.env locally).

No secret has a default value. The API key is a SecretStr so it never shows up in
repr() or accidental log lines.
"""

from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_MODEL_NAME_RE = re.compile(r"^[A-Za-z0-9._-]+$")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
    )

    # Model provider
    gemini_api_key: Optional[SecretStr] = None
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_thinking_level: Optional[Literal["minimal", "low", "medium", "high"]] = None
    gemini_thinking_budget: Optional[int] = Field(default=None, ge=0)
    gemini_base_url: str = "https://generativelanguage.googleapis.com"

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Input / output limits
    max_message_chars: int = Field(default=2000, ge=1)
    max_history_messages: int = Field(default=10, ge=0)
    max_history_chars: int = Field(default=6000, ge=1)
    max_output_tokens: int = Field(default=1024, ge=64)
    max_output_tokens_technical: int = Field(default=2048, ge=64)
    model_timeout_seconds: float = Field(default=25.0, gt=0)
    temperature: float = Field(default=0.3, ge=0, le=2)

    # Rate limiting
    rate_limit_requests: int = Field(default=20, ge=1)
    rate_limit_window_seconds: int = Field(default=60, ge=1)
    trust_proxy_headers: bool = False

    # Daily caps (anonymous per-client IP + whole service). Keep the global cap below the
    # model provider's requests-per-day quota.
    daily_limit_per_user: int = Field(default=20, ge=1)
    daily_limit_global: int = Field(default=400, ge=1)
    daily_reset_utc_hour: int = Field(default=8, ge=0, le=23)

    log_level: str = "INFO"

    @field_validator("gemini_model")
    @classmethod
    def _valid_model_name(cls, value: str) -> str:
        if not _MODEL_NAME_RE.match(value):
            raise ValueError("GEMINI_MODEL contains invalid characters")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]

    @property
    def has_api_key(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key.get_secret_value().strip())
