"""Deterministic input safety: detect and redact credentials before they reach the model.

Heuristic by design: it catches common formats, not every possible secret. The system
prompt is the second layer. Redaction is best-effort, never a guarantee.
"""

from __future__ import annotations

import re

REDACTED = "[REDACTED]"

_SECRET_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)", re.S),
    re.compile(r"\bAIza[0-9A-Za-z_\-]{30,}\b"),  # Google API keys
    re.compile(r"\bsk-[A-Za-z0-9_\-]{20,}\b"),  # OpenAI-style keys
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),  # GitHub tokens
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),  # AWS access key IDs
    re.compile(r"\bxox[baprs]-[A-Za-z0-9\-]{10,}\b"),  # Slack tokens
    re.compile(r"\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\b"),  # JWT
    re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/\-]{20,}=*"),
]

# "password is hunter2", "senha: abc123!", "my otp code is 123456"
_LABELLED_VALUE = re.compile(
    r"(?i)\b(?:password|passwd|pwd|passphrase|senha|contrase[nñ]a|otp|pin|token|"
    r"c[oó]digo(?:\s+de\s+verifica[cç][aã]o)?|verification\s+code|mfa\s+code|api[\s_-]?key|secret)"
    r"\b\s*(?:is|=|:|é|e|es)\s*[\"']?([^\s\"']{4,})[\"']?"
)

# Statements that look like sharing a password even if the value is too short to redact.
_SHARING_INTENT = re.compile(
    r"(?i)\b(?:my|minha|mi)\s+(?:password|senha|contrase[nñ]a|passphrase)\s*(?:is|=|:|é|e|es)\b"
)

_COMMON_WORDS = {
    "weak", "strong", "safe", "secure", "fraca", "forte", "segura", "seguro", "boa", "bom", "ruim",
    "debil", "fuerte", "good", "bad",
}


def _looks_like_secret_value(value: str) -> bool:
    v = value.strip(".,;!?").lower()
    if v in _COMMON_WORDS:
        return False
    return any(ch.isdigit() for ch in v) or any(not ch.isalnum() for ch in v) or len(v) >= 8


def redact_secrets(text: str) -> tuple[str, bool]:
    """Return (redacted_text, detected). `detected` also covers 'my password is ...' phrasing."""
    detected = False
    out = text

    for pattern in _SECRET_PATTERNS:
        out, n = pattern.subn(REDACTED, out)
        detected = detected or n > 0

    def _sub_labelled(match: re.Match[str]) -> str:
        nonlocal detected
        if not _looks_like_secret_value(match.group(1)):
            return match.group(0)
        detected = True
        start, end = match.span(1)
        offset = match.start()
        return match.group(0)[: start - offset] + REDACTED + match.group(0)[end - offset :]

    out = _LABELLED_VALUE.sub(_sub_labelled, out)

    if _SHARING_INTENT.search(text):
        detected = True

    return out, detected
