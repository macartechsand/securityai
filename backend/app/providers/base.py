from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal, Sequence


@dataclass(frozen=True)
class ChatTurn:
    role: Literal["user", "assistant"]
    content: str


@dataclass(frozen=True)
class ModelAnswer:
    text: str
    # True when the model stopped because it hit the output-token limit.
    truncated: bool = False


class ProviderError(Exception):
    """Upstream model failure. Messages must never contain secrets or user content."""


class ProviderNotConfigured(ProviderError):
    """No usable credentials/configuration for the provider."""


class ProviderQuotaExceeded(ProviderError):
    """The provider rejected the call because our quota is used up (HTTP 429)."""


class ProviderTimeout(ProviderError):
    """The model did not answer within the configured timeout."""


class ModelProvider(ABC):
    """Boundary between the orchestrator and any LLM.

    Future providers (OpenAI, local models, a MacarTech model) implement this
    interface; the orchestrator does not change.
    """

    @abstractmethod
    async def generate(
        self,
        *,
        system_prompt: str,
        messages: Sequence[ChatTurn],
        max_output_tokens: int,
        temperature: float,
    ) -> ModelAnswer:
        """Return the model's answer for the conversation."""
