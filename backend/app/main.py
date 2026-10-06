from __future__ import annotations

import logging
import time
import uuid
from functools import lru_cache

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.chat import router as api_router
from app.core.config import Settings
from app.core.rate_limit import SlidingWindowRateLimiter
from app.orchestrator.orchestrator import ChatOrchestrator, InputError
from app.providers.base import (
    ModelProvider,
    ProviderError,
    ProviderNotConfigured,
    ProviderTimeout,
)
from app.providers.gemini import GeminiProvider

logger = logging.getLogger("macartech.api")

MAX_BODY_BYTES = 64 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


def _error(status: int, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"detail": detail})


def create_app(settings: Settings | None = None, provider: ModelProvider | None = None) -> FastAPI:
    settings = settings or get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)

    app = FastAPI(title="MacarTech Security AI", version="0.1.0", docs_url="/api/docs", openapi_url="/api/openapi.json")
    app.state.settings = settings
    app.state.limiter = SlidingWindowRateLimiter(settings.rate_limit_requests, settings.rate_limit_window_seconds)
    app.state.orchestrator = ChatOrchestrator(provider or GeminiProvider(settings), settings)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        max_age=600,
    )

    @app.middleware("http")
    async def guard_and_log(request: Request, call_next):
        request_id = uuid.uuid4().hex[:12]
        started = time.perf_counter()

        length = request.headers.get("content-length")
        if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
            return _error(413, "Request body too large.")

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Request-ID"] = request_id
        # Metadata only. Request bodies and model output are never logged.
        logger.info(
            "req id=%s %s %s -> %s %.0fms",
            request_id, request.method, request.url.path, response.status_code,
            (time.perf_counter() - started) * 1000,
        )
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        # Return field + message only; never echo the submitted input back.
        errors = [{"field": ".".join(str(p) for p in e.get("loc", ()) if p != "body"), "message": e.get("msg", "invalid")} for e in exc.errors()]
        return JSONResponse(status_code=422, content={"detail": "Invalid request.", "errors": errors})

    @app.exception_handler(InputError)
    async def input_error_handler(request: Request, exc: InputError):
        return _error(422, str(exc))

    @app.exception_handler(ProviderNotConfigured)
    async def not_configured_handler(request: Request, exc: ProviderNotConfigured):
        logger.error("model provider not configured")
        return _error(503, "The assistant is not available right now.")

    @app.exception_handler(ProviderTimeout)
    async def timeout_handler(request: Request, exc: ProviderTimeout):
        return _error(504, "The assistant took too long to answer. Please try again.")

    @app.exception_handler(ProviderError)
    async def provider_error_handler(request: Request, exc: ProviderError):
        return _error(502, "The assistant could not answer right now. Please try again.")

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception):
        logger.error("unhandled error type=%s", type(exc).__name__)
        return _error(500, "Internal error.")

    app.include_router(api_router)
    return app


app = create_app()
