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


from app.core.rate_limit import DailyQuota


def test_daily_quota_per_user_and_reset():
    q = DailyQuota(per_client=2, global_limit=100)
    assert q.consume("a", now=10) == (None, 1)
    assert q.consume("a", now=11) == (None, 0)
    assert q.consume("a", now=12) == ("user", 0)
    assert q.consume("b", now=12) == (None, 1)  # other clients are independent
    assert q.consume("a", now=86400 + 1) == (None, 1)  # next day


def test_daily_quota_global_cap():
    q = DailyQuota(per_client=10, global_limit=2)
    q.consume("a", now=0)
    q.consume("b", now=0)
    assert q.consume("c", now=0) == ("global", 10)


def test_daily_quota_refund_and_reset_hour():
    q = DailyQuota(per_client=1, global_limit=5, reset_utc_hour=8)
    q.consume("a", now=0)
    q.refund("a")
    assert q.consume("a", now=1) == (None, 0)
    assert q.consume("a", now=7 * 3600) == ("user", 0)  # still the same quota day
    assert q.consume("a", now=8 * 3600 + 1) == (None, 0)  # rolled over at 08:00 UTC
