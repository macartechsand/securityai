from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

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
    allowed, retry_after = request.app.state.limiter.check(client_ip(request))
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment and try again.",
            headers={"Retry-After": str(retry_after)},
        )
    orchestrator: ChatOrchestrator = request.app.state.orchestrator
    return await orchestrator.handle(payload)
