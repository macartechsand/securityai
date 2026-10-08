from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.orchestrator.orchestrator import ChatOrchestrator
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/api")


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def client_ip(request: Request) -> str:
    """Client IP for rate limiting.

    X-Forwarded-For is only honoured when TRUST_PROXY_HEADERS=true (i.e. the app runs behind
    a trusted reverse proxy). We take the rightmost entry, the one appended by the nearest
    proxy, which a client cannot forge. This assumes exactly one trusted proxy hop.
    """
    if request.app.state.settings.trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for", "")
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return request.client.host if request.client else "unknown"


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request) -> ChatResponse:
    ip = client_ip(request)
    allowed, retry_after = request.app.state.limiter.check(ip)
    if not allowed:
        return _limited("rate_limited", "Too many requests. Please wait a moment and try again.", retry_after)

    quota = request.app.state.daily_quota
    blocked, remaining = quota.consume(ip)
    if blocked:
        detail = (
            "You reached today's question limit."
            if blocked == "user"
            else "The daily capacity of the assistant has been reached."
        )
        return _limited(f"daily_limit_{blocked}", detail, quota.seconds_until_reset())

    orchestrator: ChatOrchestrator = request.app.state.orchestrator
    try:
        response = await orchestrator.handle(payload)
    except Exception:
        quota.refund(ip)  # no answer was delivered, so it does not count
        raise
    response.remaining_today = remaining
    return response


def _limited(code: str, detail: str, retry_after: int) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": detail, "code": code},
        headers={"Retry-After": str(retry_after)},
    )
