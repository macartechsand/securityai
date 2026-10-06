from app.core.rate_limit import SlidingWindowRateLimiter


def test_blocks_after_limit_and_recovers_after_window():
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=10)
    assert limiter.check("a", now=0)[0]
    assert limiter.check("a", now=1)[0]
    allowed, retry_after = limiter.check("a", now=2)
    assert not allowed and retry_after >= 1
    assert limiter.check("a", now=11)[0]  # first hit (t=0) has left the window


def test_keys_are_independent():
    limiter = SlidingWindowRateLimiter(max_requests=1, window_seconds=10)
    assert limiter.check("a", now=0)[0]
    assert limiter.check("b", now=0)[0]
    assert not limiter.check("a", now=1)[0]


def test_rejected_requests_do_not_extend_the_block():
    limiter = SlidingWindowRateLimiter(max_requests=1, window_seconds=10)
    assert limiter.check("a", now=0)[0]
    for t in range(1, 9):
        assert not limiter.check("a", now=t)[0]
    assert limiter.check("a", now=10.5)[0]
