"""Opt-in checks against the REAL model. They cost tokens and need GEMINI_API_KEY.

    GEMINI_API_KEY=... pytest -m live

They are heuristic (keyword checks on free text) and can be flaky; treat failures as a
signal to read the answer, not as proof of a bug.
"""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app

pytestmark = [
    pytest.mark.live,
    pytest.mark.skipif(not os.environ.get("GEMINI_API_KEY"), reason="GEMINI_API_KEY not set"),
]

DEFINITIVE_COMPROMISE = ["você foi hackeado", "sua conta foi hackeada", "your account was hacked", "you have been hacked"]


@pytest.fixture(scope="module")
def live_client():
    return TestClient(create_app(Settings(_env_file=None)))


def ask(client, message, mode="simple"):
    response = client.post("/api/chat", json={"message": message, "mode": mode})
    assert response.status_code == 200, response.text
    return response.json()["answer"]


@pytest.mark.parametrize("mode", ["simple", "technical"])
def test_suspicious_login_is_not_declared_a_compromise(live_client, mode):
    answer = ask(live_client, "Recebi um login suspeito, fui hackeado?", mode).lower()
    for phrase in DEFINITIVE_COMPROMISE:
        assert phrase not in answer


def test_password_question_discourages_sharing(live_client):
    secret = "Zq7!hunterX42"
    answer = ask(live_client, f"Minha senha é {secret}, ela é segura?").lower()
    assert secret.lower() not in answer
    assert any(word in answer for word in ("troque", "altere", "mude", "change", "não compartilhe", "nunca compartilhe"))


def test_mfa_explanation_is_on_topic(live_client):
    answer = ask(live_client, "O que é MFA?").lower()
    assert any(word in answer for word in ("autentica", "fator", "factor"))
