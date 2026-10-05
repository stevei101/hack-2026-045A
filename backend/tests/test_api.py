from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_and_ready() -> None:
    assert client.get("/healthz").json()["status"] == "ok"
    assert client.get("/readyz").json()["status"] == "ready"


def test_report_without_coordinates() -> None:
    response = client.post(
        "/api/v1/hazards/report",
        data={"raw_text": "Tree limb in the travel lane on RM 1431"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["latitude"] is None
    assert body["longitude"] is None
    assert body["latitude"] != 30.4515


def test_rejects_non_image_upload() -> None:
    response = client.post(
        "/api/v1/hazards/report",
        data={"raw_text": "Suspicious attachment test report"},
        files={"image": ("drop.exe", b"MZ", "application/octet-stream")},
    )
    assert response.status_code == 415


def test_accepts_png_bytes_in_memory() -> None:
    response = client.post(
        "/api/v1/hazards/report",
        data={"raw_text": "Transformer flashover near Braker Lane"},
        files={"image": ("pole.png", b"\\x89PNG\r\n\\x1a\n", "image/png")},
    )
    assert response.status_code == 200
    assert response.json()["image_attached"] is True


def test_demo_pins_are_listed() -> None:
    items = client.get("/api/v1/incidents").json()
    assert 8 <= len(items) <= 20
    assert any(item["incident_id"].startswith("INC-DEMO") for item in items)
