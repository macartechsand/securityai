"""Basic in-memory sliding-window rate limiter.

Good enough for a single-instance MVP (e.g. a free web service). It is per process:
with several instances, or after a restart, counters are not shared. Replace with a
shared store (Redis, platform-level limits) if the service is scaled out.
"""

from __future__ import annotations

import time
from collections import deque

_MAX_TRACKED_KEYS = 10_000


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = {}

    def check(self, key: str, now: float | None = None) -> tuple[bool, int]:
        """Record a hit for `key`. Returns (allowed, retry_after_seconds)."""
        now = time.monotonic() if now is None else now
        cutoff = now - self.window_seconds

        if len(self._hits) >= _MAX_TRACKED_KEYS:
            self._purge(cutoff)

        hits = self._hits.setdefault(key, deque())
        while hits and hits[0] <= cutoff:
            hits.popleft()

        if len(hits) >= self.max_requests:
            retry_after = max(1, int(hits[0] + self.window_seconds - now) + 1)
            return False, retry_after

        hits.append(now)
        return True, 0

    def _purge(self, cutoff: float) -> None:
        for key in [k for k, q in self._hits.items() if not q or q[-1] <= cutoff]:
            del self._hits[key]
