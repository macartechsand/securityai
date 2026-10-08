from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from app.providers.base import ChatTurn, ProviderError, ProviderNotConfigured, ProviderTimeout
from app.providers.gemini import GeminiProvider
from tests.conftest import TEST_API_KEY, make_settings


def run_generate(handler, settings=None, messages=None):
    transport = httpx.MockTransport(handler)

    async def go():
        async with httpx.AsyncClient(transport=transport) as client:
            provider = GeminiProvider(settings or make_settings(), client=client)
            return await provider.generate(
                system_prompt="SYS",
                messages=messages or [ChatTurn("user", "hello")],
                max_output_tokens=100,
                temperature=0.2,
            )

    return asyncio.run(go())


def ok_payload(text="hi there"):
    return {"candidates": [{"content": {"parts": [{"text": text}]}, "finishReason": "STOP"}]}


def test_success_and_request_shape():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["headers"] = request.headers
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json=ok_payload())

    answer = run_generate(
        handler,
        make_settings(gemini_model="some-model", gemini_thinking_budget=0),
        [ChatTurn("user", "q1"), ChatTurn("assistant", "a1"), ChatTurn("user", "q2")],
    )
    assert answer.text == "hi there"
    assert answer.truncated is False
    assert seen["url"].endswith("/v1beta/models/some-model:generateContent")
    # key travels in a header, never in the URL
    assert TEST_API_KEY not in seen["url"]
    assert seen["headers"]["x-goog-api-key"] == TEST_API_KEY
    body = seen["body"]
    assert body["system_instruction"]["parts"][0]["text"] == "SYS"
    assert [c["role"] for c in body["contents"]] == ["user", "model", "user"]
    assert body["generationConfig"]["maxOutputTokens"] == 100
    assert body["generationConfig"]["thinkingConfig"] == {"thinkingBudget": 0}


def test_thinking_config_omitted_by_default():
    seen = {}

    def handler(request):
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json=ok_payload())

    run_generate(handler)
    assert "thinkingConfig" not in seen["body"]["generationConfig"]


def test_http_error_does_not_leak_body_or_key():
    def handler(request):
        return httpx.Response(400, text=f"bad request containing {TEST_API_KEY} and user text")

    with pytest.raises(ProviderError) as exc:
        run_generate(handler)
    assert TEST_API_KEY not in str(exc.value)
    assert "user text" not in str(exc.value)


def test_timeout_maps_to_provider_timeout():
    def handler(request):
        raise httpx.ReadTimeout("slow", request=request)

    with pytest.raises(ProviderTimeout):
        run_generate(handler)


def test_transport_error_maps_to_provider_error():
    def handler(request):
        raise httpx.ConnectError("down", request=request)

    with pytest.raises(ProviderError):
        run_generate(handler)


@pytest.mark.parametrize(
    "payload",
    [
        {"candidates": []},
        {"candidates": [{"content": {"parts": []}, "finishReason": "MAX_TOKENS"}]},
        {"promptFeedback": {"blockReason": "SAFETY"}},
    ],
)
def test_unusable_responses_raise(payload):
    with pytest.raises(ProviderError):
        run_generate(lambda request: httpx.Response(200, json=payload))


def test_invalid_json_raises():
    with pytest.raises(ProviderError):
        run_generate(lambda request: httpx.Response(200, text="not json"))


def test_missing_api_key_raises_not_configured():
    with pytest.raises(ProviderNotConfigured):
        run_generate(lambda r: httpx.Response(200, json=ok_payload()), make_settings(gemini_api_key=None))


def test_max_tokens_finish_reason_marks_truncated():
    payload = ok_payload("cut off")
    payload["candidates"][0]["finishReason"] = "MAX_TOKENS"
    answer = run_generate(lambda request: httpx.Response(200, json=payload))
    assert answer.text == "cut off"
    assert answer.truncated is True


async def _no_sleep(_seconds):
    return None


def test_503_is_retried_once_then_succeeds(monkeypatch):
    monkeypatch.setattr("app.providers.gemini.asyncio.sleep", _no_sleep)
    calls = []

    def handler(request):
        calls.append(1)
        return httpx.Response(503) if len(calls) == 1 else httpx.Response(200, json=ok_payload())

    assert run_generate(handler).text == "hi there"
    assert len(calls) == 2


def test_503_twice_fails_after_a_single_retry(monkeypatch):
    monkeypatch.setattr("app.providers.gemini.asyncio.sleep", _no_sleep)
    calls = []

    def handler(request):
        calls.append(1)
        return httpx.Response(503)

    with pytest.raises(ProviderError):
        run_generate(handler)
    assert len(calls) == 2


def test_thinking_level_is_sent_and_wins_over_budget():
    seen = {}

    def handler(request):
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json=ok_payload())

    run_generate(handler, make_settings(gemini_thinking_level="minimal", gemini_thinking_budget=0))
    assert seen["body"]["generationConfig"]["thinkingConfig"] == {"thinkingLevel": "minimal"}
