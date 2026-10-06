from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal, Sequence


@dataclass(frozen=True)
class ChatTurn:
    role: Literal["user", "assistant"]
    content: str


class ProviderError(Exception):
    """Upstream model failure. Messages must never contain secrets or user content."""


class ProviderNotConfigured(ProviderError):
    """No usable credentials/configuration for the provider."""


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
    ) -> str:
        """Return the model's text answer for the conversation."""
