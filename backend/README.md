# MacarTech Security AI: backend

FastAPI service: `GET /api/health`, `POST /api/chat`. Full documentation is in the repository
[README](../README.md), [ARCHITECTURE](../docs/ARCHITECTURE.md) and [SECURITY](../docs/SECURITY.md).

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # set GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
pytest                          # offline tests
GEMINI_API_KEY=... pytest -m live   # optional, real model
```

Run all commands from this directory (`backend/`).
