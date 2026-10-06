# MacarTech Security AI

An identity-security assistant: ask about passwords, MFA, phishing, suspicious logins, leaked
credentials and account protection, and get an answer at the depth you need.

**Status: early MVP (v0.1).** It is a chat on top of one LLM with a security-focused prompt and a
few deterministic safety checks. Everything listed under [Not implemented yet](#not-implemented-yet)
is planned, not built.

## What works today

- **Chat** (React + TypeScript + Vite + Tailwind) with conversation kept only in the browser session.
- **Simple / Technical modes** you can switch mid-conversation. Both modes share the same base
  rules and are meant to reach the same diagnosis; the mode changes vocabulary, depth and format.
- **Evidence boundary:** the model is instructed not to claim a compromise, theft or attack without
  sufficient evidence, and to separate facts, user-provided information, possible explanations,
  inference, recommendations and uncertainty.
- **Secrets handling:** the assistant never asks for passwords, codes or keys. If a message looks
  like it contains one, it is redacted before reaching the model and the UI shows a warning.
- **Python backend** (FastAPI) between the browser and the model. The API key exists only there.
- **Model provider abstraction** (`ModelProvider`) with a Gemini implementation.
- Input limits, request timeouts, CORS allow-list, basic per-IP rate limiting, no message content in logs.

## Not implemented yet

RAG and security knowledge base, source citations, evidence engine, risk scoring, MITRE ATT&CK /
NIST / OWASP content, security tools (breach lookups, URL checks), user accounts, persistence,
evaluation suite, enterprise features (IAM/PAM/ITDR integrations). The model has **no tools** in this
version: it cannot look up breaches, inspect links or read logs, and it is told not to pretend it can.

## Architecture

```
React (Vite)  ->  POST /api/chat  ->  FastAPI  ->  Orchestrator  ->  ModelProvider  ->  Gemini
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/SECURITY.md](docs/SECURITY.md).

## Run locally

Requirements: Node 18+, Python 3.10+.

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                    # then set GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000

# 2. Frontend (new terminal, repo root)
npm install
npm run dev                                             # http://localhost:5173
```

In development Vite proxies `/api` to `http://localhost:8000`, so the frontend needs no URL
configuration. Check the backend with `curl http://localhost:8000/api/health`.

### Tests

```bash
cd backend && pytest                       # offline: uses a fake model provider
GEMINI_API_KEY=... pytest -m live          # optional: checks against the real model (costs tokens)
npm run typecheck && npm run build         # frontend
```

## Environment variables

**Backend** (`backend/.env`, never committed; template in `backend/.env.example`)

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | none | **Secret.** Model API key. Without it `/api/chat` returns 503. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model name. Check the current list before deploying; names change. |
| `GEMINI_THINKING_BUDGET` | unset | `0` disables thinking on 2.5 Flash. Remove for models that reject it. |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated exact frontend origins. |
| `MAX_MESSAGE_CHARS` | `2000` | Max user message length. |
| `MAX_HISTORY_MESSAGES` / `MAX_HISTORY_CHARS` | `10` / `6000` | History kept per request / max length per item. |
| `MAX_OUTPUT_TOKENS` | `1024` | Output cap. |
| `MODEL_TIMEOUT_SECONDS` | `25` | Upstream timeout. |
| `TEMPERATURE` | `0.3` | Sampling temperature. |
| `RATE_LIMIT_REQUESTS` / `RATE_LIMIT_WINDOW_SECONDS` | `20` / `60` | Per-IP limit on `/api/chat`. |
| `TRUST_PROXY_HEADERS` | `false` | `true` only behind exactly one trusted proxy. |
| `LOG_LEVEL` | `INFO` | Logging level. |

**Frontend** (`.env`, public values only; template in `.env.example`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Public backend URL for production builds. Empty in development. **Never put a secret in a `VITE_*` variable**: it is embedded in the browser bundle. |

## API

`GET /api/health` -> `{"status": "ok"}`

`POST /api/chat`

```json
{
  "message": "How can I protect my account from takeover?",
  "mode": "simple",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

`mode` is `simple` (default) or `technical`; `history` is optional. Response:

```json
{ "answer": "...", "mode": "simple", "warnings": [] }
```

`warnings` may contain `secret_detected`. Errors return `{"detail": "..."}` with status 413/422
(invalid input), 429 (rate limit, with `Retry-After`), 502/504 (model failure/timeout), 503 (not configured).
Interactive docs are at `/api/docs`.

## Deploy

Cheapest simple path: a free **Render** web service for the API plus a free static host for the
frontend. Free tiers change, so check current limits; on Render's free plan the service sleeps when
idle, so the first request after a pause is slow.

1. **Backend on Render.** Create a Blueprint from this repo (`render.yaml`) or a Web Service with
   root directory `backend`, build `pip install -r requirements.txt`, start
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, health check `/api/health`. Set
   `GEMINI_API_KEY` (secret) and `CORS_ORIGINS` (your frontend URL, no trailing slash) in the dashboard.
   If the build fails on the Python version, set `PYTHON_VERSION` (the code needs 3.10+).
2. **Frontend on Cloudflare Pages or Netlify.** Build command `npm run build`, output directory `dist`,
   environment variable `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`. `public/_redirects`
   provides the SPA fallback. (On Vercel, add a rewrite of all paths to `/index.html`.)
3. Redeploy the frontend after changing `VITE_API_BASE_URL`; it is baked in at build time.
4. Verify: `curl https://<api>/api/health`, then send a message from the site.

## Limitations

- Answers come from a general LLM guided by a prompt. They can be wrong and are not grounded in
  retrieved sources yet. The prompt rules are instructions, not guarantees.
- Secret redaction is heuristic and will miss some formats.
- Rate limiting is in memory and per process: fine for one instance, not for scaling out.
- The interface is translated into English and Portuguese only (chosen from the browser language); the model replies in whatever language the user writes in.
- No automated frontend tests yet.

## Roadmap

1. Public validation: collect real questions (without personal data) and build an evaluation set.
2. Security knowledge + RAG with source attribution (NIST, MITRE ATT&CK, OWASP, CISA).
3. Evidence engine and structured risk assessment.
4. Identity-security workflows and tools (breach checks, phishing-link analysis).
5. Enterprise capabilities (IAM/PAM/ITDR), kept in a separate layer.
6. Specialised models, only after a benchmark shows they beat prompting + RAG.

## License

No license file is present yet. Add one before accepting outside contributions.
