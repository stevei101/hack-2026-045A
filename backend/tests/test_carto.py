from app.carto import public_config
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_public_config_never_returns_a_token(monkeypatch) -> None:
    monkeypatch.setenv("CARTO_API_ACCESS_TOKEN", "should-not-leak")
    config = public_config()
    assert config.api_base_url == "https://gcp-us-east1.api.carto.com"
    assert config.organization == "hack-2026-045A"
    assert config.organization_id == "ac_1f2p12xz"
    assert config.token_status == "present"
    dumped = config.model_dump()
    assert "should-not-leak" not in str(dumped)


def test_config_endpoint_omits_secret() -> None:
    body = client.get("/api/v1/carto/config").json()
    assert body["api_base_url"] == "https://gcp-us-east1.api.carto.com"
    assert "token" not in body
    assert body["token_status"] in {"missing", "present"}
