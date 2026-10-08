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


class DailyQuota:
    """Per-client and global daily caps on model calls (in memory, per process).

    "Client" is the anonymous client IP: the MVP has no accounts. The global cap keeps the
    service under the model provider's daily quota. The day rolls over at `reset_utc_hour`
    (8 = midnight US Pacific standard time, when Gemini quotas reset). Counters are lost on
    restart, so the provider's own quota stays the final backstop.
    """

    def __init__(self, per_client: int, global_limit: int, reset_utc_hour: int = 0) -> None:
        self.per_client = per_client
        self.global_limit = global_limit
        self._offset = reset_utc_hour * 3600
        self._day = -1
        self._used: dict[str, int] = {}
        self._global_used = 0

    def _roll(self, now: float) -> None:
        day = int((now - self._offset) // 86400)
        if day != self._day:
            self._day = day
            self._used.clear()
            self._global_used = 0

    def seconds_until_reset(self, now: float | None = None) -> int:
        now = time.time() if now is None else now
        return int(86400 - ((now - self._offset) % 86400)) + 1

    def consume(self, key: str, now: float | None = None) -> tuple[str | None, int]:
        """Take one unit. Returns (blocked_scope or None, remaining_for_client)."""
        self._roll(time.time() if now is None else now)
        used = self._used.get(key, 0)
        if used >= self.per_client:
            return "user", 0
        if self._global_used >= self.global_limit:
            return "global", self.per_client - used
        self._used[key] = used + 1
        self._global_used += 1
        return None, self.per_client - used - 1

    def refund(self, key: str) -> None:
        """Give a unit back when the model call failed (the user got no answer)."""
        if self._used.get(key, 0) > 0:
            self._used[key] -= 1
            self._global_used = max(0, self._global_used - 1)
