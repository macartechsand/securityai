"""Chat orchestrator: validate -> sanitize -> compose prompt -> call provider -> respond.

Future stages (retrieval, tools, evidence, risk assessment, evaluation) plug in between
"compose prompt" and "call provider" without changing the API or the provider interface.
"""

from __future__ import annotations

import logging

from app.core.config import Settings
from app.orchestrator.safety import redact_secrets
from app.prompts.composer import compose_system_prompt
from app.providers.base import ChatTurn, ModelProvider
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger("macartech.orchestrator")


class InputError(ValueError):
    """The request is well-formed but violates a configured limit."""


class ChatOrchestrator:
    def __init__(self, provider: ModelProvider, settings: Settings) -> None:
        self._provider = provider
        self._settings = settings

    async def handle(self, request: ChatRequest) -> ChatResponse:
        s = self._settings

        # 1. Validation (configurable limits)
        if len(request.message) > s.max_message_chars:
            raise InputError(f"message exceeds {s.max_message_chars} characters")
        for item in request.history:
            if len(item.content) > s.max_history_chars:
                raise InputError(f"history message exceeds {s.max_history_chars} characters")

        # 2. History: keep the most recent turns, start on a user turn, drop blanks
        history = [h for h in request.history if h.content.strip()]
        history = history[-s.max_history_messages :] if s.max_history_messages else []
        while history and history[0].role != "user":
            history.pop(0)

        # 3. Secret detection / redaction (message and history)
        secret_detected = False
        turns: list[ChatTurn] = []
        for item in history:
            content, hit = redact_secrets(item.content)
            secret_detected = secret_detected or hit
            turns.append(ChatTurn(role=item.role, content=content))
        message, hit = redact_secrets(request.message)
        secret_detected = secret_detected or hit
        turns.append(ChatTurn(role="user", content=message))

        # 4. Prompt (mode only changes the presentation layer)
        system_prompt = compose_system_prompt(request.mode, secret_detected)

        # 5. Model call. Never log message content.
        logger.info(
            "chat mode=%s history=%d msg_chars=%d secret_detected=%s",
            request.mode, len(history), len(request.message), secret_detected,
        )
        answer = await self._provider.generate(
            system_prompt=system_prompt,
            messages=turns,
            max_output_tokens=s.max_output_tokens,
            temperature=s.temperature,
        )

        warnings = ["secret_detected"] if secret_detected else []
        return ChatResponse(answer=answer, mode=request.mode, warnings=warnings)
