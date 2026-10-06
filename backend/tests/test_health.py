def test_health_returns_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_does_not_need_api_key(make_client):
    from tests.conftest import make_settings

    client = make_client(make_settings(gemini_api_key=None))
    assert client.get("/api/health").status_code == 200
