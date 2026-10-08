# Architecture

## Overview

```
Browser (React/Vite)
   |  POST /api/chat  { message, mode, history }
   v
FastAPI  (app/api/chat.py)       rate limit, schema validation, error mapping
   v
ChatOrchestrator                 limits, history trimming, secret redaction, prompt composition
   v
ModelProvider (interface)        GeminiProvider today
   v
LLM
```

The frontend never calls a model provider and holds no secret. The only configuration it has is
the public backend URL.

## Backend layout

```
backend/app/
  main.py                  create_app(): middleware, CORS, exception handlers
  api/chat.py              GET /api/health, POST /api/chat, client-IP helper
  core/config.py           Settings from env (API key is a SecretStr)
  core/rate_limit.py       in-memory sliding-window limiter
  schemas/chat.py          ChatRequest / ChatResponse (Pydantic)
  orchestrator/
    orchestrator.py        the request pipeline
    safety.py              secret detection and redaction
  prompts/
    base.py                rules shared by every mode
    simple.py, technical.py  presentation modules
    composer.py            base + mode (+ secret notice)
  providers/
    base.py                ModelProvider, ChatTurn, ProviderError types
    gemini.py              Gemini over REST via httpx (no SDK)
```

`create_app(settings, provider)` takes its dependencies as arguments, which is how the tests run the
whole API with a fake provider and no network.

## Request pipeline

1. **Schema validation** (Pydantic): types, `mode` in {simple, technical}, non-blank message, unknown fields rejected, hard size caps.
2. **Orchestrator validation:** configurable limits (`MAX_MESSAGE_CHARS`, `MAX_HISTORY_CHARS`). Violations return 422.
3. **History:** keep the latest `MAX_HISTORY_MESSAGES`, drop leading assistant turns so the conversation starts with a user turn.
4. **Secret redaction** on the message and history (see SECURITY.md). A detection adds a system notice and a `secret_detected` warning.
5. **Prompt composition:** `BASE_PROMPT` + mode module (+ notice).
6. **Provider call** with output-token limit, temperature and timeout.
7. **Response:** `{answer, mode, warnings}`.

## Simple vs Technical

One pipeline, one base prompt. `mode` selects only the presentation module. The base prompt states that
the diagnosis, confidence and recommended actions must not change with the mode. The frontend sends
the current mode on every request, so switching does not restart the conversation. Parity of the
*model's* behaviour across modes is an instruction, not something the code can enforce; it should be
measured by the future evaluation suite.

## Extension points (not built)

The orchestrator's stages are the place to add the next capabilities without changing the API or the provider interface:

| Future component | Where it plugs in |
|---|---|
| Retriever (RAG, security knowledge) | between redaction and prompt composition; adds context and sources |
| ToolRegistry (breach/URL checks) | between composition and provider call; tool results are untrusted input |
| EvidenceEngine / RiskAssessor | after the provider call, structuring the answer and adding `risk` / `sources` fields |
| Evaluator | offline: replays a question set through `ChatOrchestrator` with different providers/prompts |
| New providers (OpenAI, local, MacarTech) | implement `ModelProvider` |
| Enterprise layer | separate package that registers its own retrievers/tools/providers; the open core does not import it |

None of these exist yet; no stubs were added on purpose, to avoid unused abstractions.

## Frontend

`src/pages/Home.tsx` hosts `components/Chat.tsx` (state: messages, mode, input; session only). `ModeToggle`
switches modes, `MessageContent` renders a safe Markdown subset as React elements (no HTML injection),
`services/chatApi.ts` is the only code that talks to the network. Existing layout, dark mode, routing and
institutional pages were kept.

## Model

Default `gemini-3.5-flash-lite` through the Gemini REST API, configurable with `GEMINI_MODEL`. This default
was not validated against the live API during development (no key was available there); confirm the
model name and the `GEMINI_THINKING_BUDGET` setting with a live smoke test (`pytest -m live`) before launch.
