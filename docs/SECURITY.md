# Security

## Before anything else: keys from the previous prototype

This repository starts with a clean history. The earlier prototype repository
(`macartechsand/macartech_ai`) committed `.env` files containing what appear to be OpenAI and Gemini API
keys, and its history is still readable. **Revoke and rotate every key that was ever committed there**
(OpenAI and Google AI dashboards), then archive or delete that repository. Deleting the file in a later
commit does not remove a secret from history, so revocation is the only real fix.

Keep it this way here: `.env` files are git-ignored, only `.env.example` templates are tracked, and a key
must never be placed in a `VITE_*` variable.

## What the application does

| Area | Measure |
|---|---|
| Secrets | API key only in backend environment variables (`SecretStr`, never logged or returned). Frontend has no secret; `VITE_*` values are public. `.env` is git-ignored; only `.env.example` files are tracked. |
| Provider key transport | Sent in the `x-goog-api-key` header, not in the URL, so it does not appear in URLs or access logs. |
| Input | Pydantic schema (types, enum mode, blank rejection, unknown fields rejected, hard caps), configurable message/history limits, 64 KB body cap. |
| Output | `MAX_OUTPUT_TOKENS` cap; upstream timeout (`MODEL_TIMEOUT_SECONDS`). |
| Errors | Generic messages only. Provider error text, response bodies and stack traces are not returned. Validation errors do not echo the input. |
| Logging | Metadata only (request id, mode, lengths, status, latency). Message content and model output are never logged. |
| CORS | Allow-list from `CORS_ORIGINS`; no credentials; only GET/POST/OPTIONS and `Content-Type`. |
| Abuse | In-memory per-IP rate limit on `/api/chat`. `X-Forwarded-For` is trusted only when `TRUST_PROXY_HEADERS=true`, and then the rightmost entry is used (assumes exactly one trusted proxy). |
| Response headers | `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `X-Request-ID`. |
| Rendering | Model output is rendered as React elements from a small Markdown subset; it is never inserted as HTML. |
| User secrets | The prompt forbids requesting credentials. Common credential formats (API keys, tokens, JWTs, private keys, "password is ...", verification codes) are redacted before reaching the model; the UI warns the user. |
| Prompt injection | Input is declared untrusted data in the system prompt and the model has no tools or side effects in this version, which limits impact to the text of an answer. |

## Known limitations

- **Prompt rules are not guarantees.** The evidence boundary ("do not claim compromise without evidence") is
  enforced by instruction. Check it with `pytest -m live` and by reading real answers; add an evaluation suite.
- **Redaction is heuristic.** It misses unusual formats and can occasionally redact harmless text.
- **Rate limiting is per process and in memory.** Restarts reset it; multiple instances do not share it; clients behind one NAT share a limit.
- **No authentication.** Anyone can use the endpoint within the rate limit, and each request costs model tokens. Set a spending cap in the provider console.
- **User messages go to a third-party model provider.** Say so in the privacy policy; the existing legal pages are generic text and need review (LGPD).
- **Dependencies were not audited** during development (registry access was blocked). Run `npm audit` and `pip-audit` before launch.
- **No HTTPS or security headers for the static frontend** are configured here; use the host's defaults and add CSP if desired.

## When the system grows

Treat retrieved documents and tool outputs as untrusted input (RAG poisoning, indirect prompt injection),
require explicit confirmation for any action with side effects, and keep enterprise code and data in a separate layer.
