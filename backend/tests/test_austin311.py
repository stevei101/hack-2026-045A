from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.austin311 import box_clause, nearby_clause, query_ticket_count
from app.main import app
from app.models import Austin311Context

client = TestClient(app)
SOURCE = Path(__file__).resolve().parents[1] / "app" / "austin311.py"


def test_module_has_no_phantom_coordinates() -> None:
    text = SOURCE.read_text()
    for token in ("30.4515", "-97.6564", "30.3150", "-97.7280"):
        assert token not in text


def test_other_category_skips_soda() -> None:
    context = query_ticket_count(category="OTHER", lat=None, lng=None)
    assert context.ticket_count is None
    assert context.scope == "unavailable"


def test_citywide_count_when_gps_omitted() -> None:
    with patch("app.austin311.soda_count", return_value=128) as mocked:
        context = query_ticket_count(category="ELECTRICAL", lat=None, lng=None)
    mocked.assert_called_once()
    assert "STREET LIGHT" in mocked.call_args.args[0]
    assert "within_circle" not in mocked.call_args.args[0]
    assert context.ticket_count == 128
    assert context.scope == "citywide_type"


def test_nearby_requires_both_coordinates() -> None:
    with patch("app.austin311.soda_count", return_value=9) as mocked:
        context = query_ticket_count(category="WATER_FLOODING", lat=30.3122, lng=-97.7396)
    where = mocked.call_args.args[0]
    assert "within_circle" in where
    assert "30.312200" in where
    assert "-97.739600" in where
    assert context.scope == "nearby"
    assert context.ticket_count == 9


def test_partial_coordinates_are_not_invented(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.austin311.soda_count", lambda where: 3)
    context = query_ticket_count(category="TRAFFIC_SIGNAL", lat=30.3122, lng=None)
    assert context.scope == "citywide_type"
    assert "30.3150" not in box_clause(30.3122, -97.7396)


def test_soda_failure_omits_count_instead_of_inventing() -> None:
    with patch("app.austin311.soda_count", side_effect=RuntimeError("timeout")):
        context = query_ticket_count(category="ROAD_OBSTRUCTION", lat=None, lng=None)
    assert context.ticket_count is None
    assert context.scope == "unavailable"


def test_nearby_clause_uses_reporter_point_only() -> None:
    clause = nearby_clause(30.4015, -97.7164)
    assert "30.401500" in clause
    assert "30.4515" not in clause
    assert "30.3150" not in clause


def test_api_context_drops_half_gps() -> None:
    fake = Austin311Context(
        ticket_count=4,
        source="data.austintexas.gov/resource/xwdj-i9he",
        scope="citywide_type",
        sr_type_filter="ELECTRICAL",
    )
    with patch("app.main.query_ticket_count", return_value=fake) as mocked:
        response = client.get(
            "/api/v1/austin311/context",
            params={"category": "ELECTRICAL", "lat": 30.3122},
        )
    assert response.status_code == 200
    mocked.assert_called_once_with(category="ELECTRICAL", lat=None, lng=None)


def test_soda_count_reads_ticket_count() -> None:
    payload = b'[{"ticket_count":"17"}]'
    response = MagicMock()
    response.read.return_value = payload
    response.__enter__.return_value = response
    response.__exit__.return_value = False
    with patch("app.austin311.urllib.request.urlopen", return_value=response):
        from app.austin311 import soda_count

        assert soda_count("upper(sr_type_desc) like '%FLOOD%'") == 17


def test_api_context_passes_pair() -> None:
    fake = Austin311Context(
        ticket_count=2,
        source="data.austintexas.gov/resource/xwdj-i9he",
        scope="nearby",
        sr_type_filter="ELECTRICAL",
    )
    with patch("app.main.query_ticket_count", return_value=fake) as mocked:
        response = client.get(
            "/api/v1/austin311/context",
            params={"category": "ELECTRICAL", "lat": 30.3122, "lng": -97.7396},
        )
    assert response.status_code == 200
    mocked.assert_called_once_with(category="ELECTRICAL", lat=30.3122, lng=-97.7396)
