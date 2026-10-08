from __future__ import annotations

from typing import Sequence

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.core.config import Settings
from app.main import create_app
from app.providers.base import ChatTurn, ModelAnswer, ModelProvider

TEST_API_KEY = "test-key-should-never-leak-0123456789"


class FakeProvider(ModelProvider):
    """Records what the orchestrator sends and returns a canned answer (or raises)."""

    def __init__(self, answer: str = "fake answer", error: Exception | None = None) -> None:
        self.answer = answer
        self.error = error
        self.truncated = False
        self.calls: list[dict] = []

    async def generate(
        self,
        *,
        system_prompt: str,
        messages: Sequence[ChatTurn],
        max_output_tokens: int,
        temperature: float,
    ) -> ModelAnswer:
        self.calls.append(
            {
                "system_prompt": system_prompt,
                "messages": list(messages),
                "max_output_tokens": max_output_tokens,
                "temperature": temperature,
            }
        )
        if self.error:
            raise self.error
        return ModelAnswer(self.answer, truncated=self.truncated)


def make_settings(**overrides) -> Settings:
    base = dict(
        gemini_api_key=SecretStr(TEST_API_KEY),
        cors_origins="http://localhost:5173",
        rate_limit_requests=1000,
    )
    base.update(overrides)
    return Settings(_env_file=None, **base)


@pytest.fixture
def provider() -> FakeProvider:
    return FakeProvider()


@pytest.fixture
def make_client(provider):
    def _make(settings: Settings | None = None, prov: ModelProvider | None = None) -> TestClient:
        app = create_app(settings or make_settings(), prov or provider)
        return TestClient(app, raise_server_exceptions=False)

    return _make


@pytest.fixture
def client(make_client) -> TestClient:
    return make_client()
