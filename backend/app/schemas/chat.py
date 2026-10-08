from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Mode = Literal["simple", "technical"]

# Hard structural caps applied at parse time. The configurable (usually stricter)
# limits are enforced by the orchestrator.
_HARD_MAX_CHARS = 20_000
_HARD_MAX_HISTORY = 50


class HistoryMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str = Field(max_length=_HARD_MAX_CHARS)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(max_length=_HARD_MAX_CHARS)
    mode: Mode = "simple"
    history: list[HistoryMessage] = Field(default_factory=list, max_length=_HARD_MAX_HISTORY)

    @field_validator("message")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be empty")
        return value


class ChatResponse(BaseModel):
    answer: str
    mode: Mode
    # Machine-readable notices for the UI, e.g. "secret_detected".
    warnings: list[str] = Field(default_factory=list)
    # Questions this client can still ask today (None when not tracked).
    remaining_today: int | None = None
