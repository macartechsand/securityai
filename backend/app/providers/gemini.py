"""Gemini provider using the public REST API directly (no SDK).

The API key is sent in the `x-goog-api-key` header, never in the URL, so it cannot
end up in access logs or exception messages.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Sequence

import httpx

from app.core.config import Settings
from app.providers.base import (
    ChatTurn,
    ModelAnswer,
    ModelProvider,
    ProviderError,
    ProviderNotConfigured,
    ProviderQuotaExceeded,
    ProviderTimeout,
)

logger = logging.getLogger("macartech.provider.gemini")


class GeminiProvider(ModelProvider):
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client  # injectable for tests

    async def generate(
        self,
        *,
        system_prompt: str,
        messages: Sequence[ChatTurn],
        max_output_tokens: int,
        temperature: float,
    ) -> ModelAnswer:
        s = self._settings
        if not s.has_api_key:
            raise ProviderNotConfigured("model provider is not configured")

        url = f"{s.gemini_base_url.rstrip('/')}/v1beta/models/{s.gemini_model}:generateContent"
        generation_config: dict[str, Any] = {
            "maxOutputTokens": max_output_tokens,
            "temperature": temperature,
        }
        if s.gemini_thinking_level is not None:
            generation_config["thinkingConfig"] = {"thinkingLevel": s.gemini_thinking_level}
        elif s.gemini_thinking_budget is not None:
            generation_config["thinkingConfig"] = {"thinkingBudget": s.gemini_thinking_budget}

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [
                {
                    "role": "user" if m.role == "user" else "model",
                    "parts": [{"text": m.content}],
                }
                for m in messages
            ],
            "generationConfig": generation_config,
        }
        headers = {
            "x-goog-api-key": s.gemini_api_key.get_secret_value(),  # type: ignore[union-attr]
            "content-type": "application/json",
        }

        response = await self._post(url, payload, headers)
        if response.status_code == 503:
            # Transient overload upstream: one retry, no more (cost and latency stay bounded).
            logger.warning("gemini returned HTTP 503, retrying once")
            await asyncio.sleep(1.0)
            response = await self._post(url, payload, headers)

        if response.status_code == 429:
            logger.warning("gemini returned HTTP 429 (quota exhausted)")
            raise ProviderQuotaExceeded("model quota exhausted")

        if response.status_code != 200:
            # Do not log the body: it may echo parts of the prompt.
            logger.warning("gemini returned HTTP %s", response.status_code)
            raise ProviderError(f"model returned HTTP {response.status_code}")

        return self._extract_text(response)

    async def _post(self, url: str, payload: dict[str, Any], headers: dict[str, str]) -> httpx.Response:
        timeout = self._settings.model_timeout_seconds
        try:
            if self._client is not None:
                return await self._client.post(url, json=payload, headers=headers, timeout=timeout)
            async with httpx.AsyncClient(timeout=timeout) as client:
                return await client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            raise ProviderTimeout("model request timed out") from exc
        except httpx.HTTPError as exc:
            # Log only the exception type: its text could include request details.
            logger.warning("gemini transport error: %s", type(exc).__name__)
            raise ProviderError("model request failed") from exc

    @staticmethod
    def _extract_text(response: httpx.Response) -> ModelAnswer:
        try:
            data = response.json()
        except ValueError as exc:
            raise ProviderError("model returned invalid JSON") from exc

        if data.get("promptFeedback", {}).get("blockReason"):
            raise ProviderError("model blocked the request")

        candidates = data.get("candidates") or []
        if not candidates:
            raise ProviderError("model returned no candidates")

        candidate = candidates[0]
        parts = (candidate.get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts if isinstance(p, dict)).strip()
        if not text:
            logger.warning("gemini returned empty text (finishReason=%s)", candidate.get("finishReason"))
            raise ProviderError("model returned an empty answer")
        return ModelAnswer(text=text, truncated=candidate.get("finishReason") == "MAX_TOKENS")
