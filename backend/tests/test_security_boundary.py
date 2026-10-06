"""Security boundary tests.

These verify the deterministic parts of the boundary (redaction, notices, prompt contents,
mode parity). Whether the *model* actually follows the rules can only be checked against a
real model: see test_live_model.py (opt-in).
"""

from __future__ import annotations

import pytest

from app.orchestrator.safety import REDACTED, redact_secrets
from app.prompts.base import BASE_PROMPT
from app.prompts.composer import SECRET_NOTICE, compose_system_prompt


def post(client, message, mode="simple", **extra):
    return client.post("/api/chat", json={"message": message, "mode": mode, **extra})


# --- password shared in chat ------------------------------------------------------------------

def test_password_with_value_is_redacted_before_reaching_model(client, provider):
    response = post(client, "My password is Hunter2!xyz, is it safe?")
    assert response.status_code == 200
    sent = provider.calls[0]
    assert "Hunter2!xyz" not in sent["messages"][-1].content
    assert REDACTED in sent["messages"][-1].content
    assert SECRET_NOTICE in sent["system_prompt"]
    assert response.json()["warnings"] == ["secret_detected"]


def test_password_phrase_with_placeholder_still_triggers_notice(client, provider):
    response = post(client, "Minha senha é X, ela é segura?")
    assert response.json()["warnings"] == ["secret_detected"]
    assert SECRET_NOTICE in provider.calls[0]["system_prompt"]


def test_secret_in_history_is_redacted(client, provider):
    history = [
        {"role": "user", "content": "my api key is AIza" + "A" * 35},
        {"role": "assistant", "content": "Please do not share keys."},
    ]
    post(client, "ok what now?", history=history)
    sent_text = " ".join(t.content for t in provider.calls[0]["messages"])
    assert "AIza" + "A" * 35 not in sent_text
    assert SECRET_NOTICE in provider.calls[0]["system_prompt"]


@pytest.mark.parametrize(
    "text",
    [
        "token sk-" + "a1B2" * 8,
        "ghp_" + "a1B2c3" * 7,
        "AKIA" + "ABCDEFGHIJKLMNOP",
        "Authorization: Bearer " + "abcdEFGH1234" * 3,
        "eyJhbGciOi1.eyJzdWIiOjEyMzQ1.SflKxwRJSMeKKF2QT4",
        "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAK\n-----END RSA PRIVATE KEY-----",
        "meu código de verificação é 482913",
        "senha: correcthorse9",
    ],
)
def test_common_secret_formats_are_redacted(text):
    redacted, detected = redact_secrets(text)
    assert detected
    assert REDACTED in redacted


@pytest.mark.parametrize(
    "text",
    [
        "What is MFA?",
        "Minha senha é fraca, o que faço?",
        "My password is weak. How do I improve it?",
        "Someone tried to log into my account several times",
    ],
)
def test_normal_questions_are_not_redacted(text):
    redacted, _ = redact_secrets(text)
    assert redacted == text


# --- suspicious login: must not assert compromise -------------------------------------------------

def test_base_prompt_forbids_claiming_compromise_without_evidence():
    lowered = BASE_PROMPT.lower()
    assert "never state or imply" in lowered
    assert "compromised" in lowered
    assert "sufficient" in lowered
    # the worked example from the product brief
    assert "login alert from another country" in lowered
    for explanation in ("vpn", "existing session", "inaccurate"):
        assert explanation in lowered


def test_base_prompt_requires_evidence_categories():
    lowered = BASE_PROMPT.lower()
    for category in (
        "known facts",
        "information provided by the user",
        "possible explanations",
        "inference",
        "recommendations",
        "uncertainty",
    ):
        assert category in lowered


def test_base_prompt_forbids_asking_for_secrets():
    lowered = BASE_PROMPT.lower()
    for item in ("passwords", "one-time codes", "api keys", "private keys", "access tokens"):
        assert item in lowered
    assert "never ask" in lowered


def test_base_prompt_treats_user_text_as_untrusted():
    assert "untrusted input" in BASE_PROMPT.lower()


# --- Simple / Technical share the same fundamental analysis ---------------------------------------

def test_modes_share_identical_base_rules():
    simple = compose_system_prompt("simple")
    technical = compose_system_prompt("technical")
    assert simple.startswith(BASE_PROMPT)
    assert technical.startswith(BASE_PROMPT)
    assert "RESPONSE MODE: SIMPLE" in simple and "RESPONSE MODE: TECHNICAL" not in simple
    assert "RESPONSE MODE: TECHNICAL" in technical and "RESPONSE MODE: SIMPLE" not in technical


def test_secret_notice_only_added_when_detected():
    assert SECRET_NOTICE not in compose_system_prompt("simple")
    assert SECRET_NOTICE in compose_system_prompt("technical", secret_detected=True)


@pytest.mark.parametrize("mode", ["simple", "technical"])
def test_mode_reaches_provider(client, provider, mode):
    post(client, "Recebi um login suspeito, fui hackeado?", mode=mode)
    prompt = provider.calls[0]["system_prompt"]
    assert f"RESPONSE MODE: {mode.upper()}" in prompt
    assert BASE_PROMPT in prompt


# --- plain educational question passes straight through -----------------------------------------

def test_what_is_mfa_is_forwarded_untouched_without_warnings(client, provider):
    response = post(client, "O que é MFA?")
    assert response.status_code == 200
    assert response.json()["warnings"] == []
    assert provider.calls[0]["messages"][-1].content == "O que é MFA?"
    assert SECRET_NOTICE not in provider.calls[0]["system_prompt"]
