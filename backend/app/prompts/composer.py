from __future__ import annotations

from app.prompts.base import BASE_PROMPT
from app.prompts.simple import SIMPLE_MODE_PROMPT
from app.prompts.technical import TECHNICAL_MODE_PROMPT
from app.schemas.chat import Mode

_MODE_PROMPTS: dict[str, str] = {
    "simple": SIMPLE_MODE_PROMPT,
    "technical": TECHNICAL_MODE_PROMPT,
}

SECRET_NOTICE = """\
SYSTEM NOTICE
The user's message may contain a credential or secret. Values that looked sensitive were replaced with \
[REDACTED] before reaching you. Do not ask for it and do not repeat it. Briefly tell the user to treat \
anything they already shared as exposed (change or revoke it) and not to share passwords, codes, keys \
or tokens in chat. If nothing sensitive was actually shared, do not dwell on this.
"""


def compose_system_prompt(mode: Mode, secret_detected: bool = False) -> str:
    """Base rules + mode module (+ secret notice). The base rules never vary by mode."""
    parts = [BASE_PROMPT, _MODE_PROMPTS[mode]]
    if secret_detected:
        parts.append(SECRET_NOTICE)
    return "\n".join(parts)
