import io

from fastapi.testclient import TestClient

from app.agent import card_or_unclassified
from app.main import app

client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    ready = client.get("/readyz")
    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"


def test_seed_list_has_eight_mapped_pins():
    response = client.get("/api/v1/hazards")
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) == 8
    for row in rows:
        assert row["latitude"] is not None
        assert row["longitude"] is not None
        assert 30.0 < row["latitude"] < 31.0
        assert -98.2 < row["longitude"] < -97.3


def test_report_without_coordinates_stays_unmapped():
    response = client.post("/api/v1/hazards/report", data={"raw_text": "Wire sparking across Lamar Blvd near 45th"})
    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "ELECTRICAL"
    assert body["severity"] == "CRITICAL"
    assert body["target_agency"] == "AUSTIN_ENERGY"
    assert body["latitude"] is None
    assert body["longitude"] is None
    assert body["latitude"] != 30.4515
    assert body["model_name"] == "local-rules-v1"


def test_non_image_upload_is_rejected():
    response = client.post(
        "/api/v1/hazards/report",
        data={"raw_text": "Wire sparking across the road"},
        files={"image": ("payload.exe", io.BytesIO(b"MZ not an image"), "application/octet-stream")},
    )
    assert response.status_code == 415


def test_jpeg_bytes_are_accepted_without_a_remote_fetch():
    jpeg = b"\xff\xd8\xff\xd9"
    response = client.post(
        "/api/v1/hazards/report",
        data={"raw_text": "Clogged storm drain on the corner", "lat": "30.27", "lng": "-97.74"},
        files={"image": ("drain.jpg", io.BytesIO(jpeg), "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["image_attached"] is True
    assert body["latitude"] == 30.27
    assert body["longitude"] == -97.74


def test_configured_key_does_not_return_500(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "invalid-test-key")
    response = client.post("/api/v1/hazards/report", data={"raw_text": "Wire sparking across Lamar Blvd near 45th"})
    assert response.status_code == 200
    body = response.json()
    assert body["model_name"] == "fallback-cache-travis-v1"
    assert body["latitude"] is None
    assert "invalid-test-key" not in response.text


def test_malformed_model_payload_is_unclassified():
    card = card_or_unclassified({"category": "NOT_A_CATEGORY"}, "Wire down")
    assert card.category == "OTHER"
    assert card.confidence_score == 0.0
    assert card.latitude is None
    assert card.model_name == "fallback-cache-travis-v1"
