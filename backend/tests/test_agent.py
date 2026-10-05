from app.agent import extract_incident
from app.models import HazardInputPayload


def test_missing_coordinates_stay_null() -> None:
    card = extract_incident(
        HazardInputPayload(raw_text="Wire sparking across Lamar Blvd near 45th")
    )
    assert card.latitude is None
    assert card.longitude is None
    assert card.category == "ELECTRICAL"
    assert card.severity == "CRITICAL"
    assert card.target_agency == "AUSTIN_ENERGY"
    assert card.model_name


def test_reported_point_is_copied_not_invented() -> None:
    card = extract_incident(
        HazardInputPayload(
            raw_text="Dark traffic signal at Lamar and 45th",
            reported_lat=30.3122,
            reported_lng=-97.7396,
        )
    )
    assert card.latitude == 30.3122
    assert card.longitude == -97.7396


def test_unclassified_failure_keeps_citizen_text() -> None:
    card = extract_incident(HazardInputPayload(raw_text="Something odd on the shoulder"))
    assert card.summary.startswith("Something odd")
    assert card.incident_id.startswith("INC-")


def test_citizen_report_is_not_replaced_by_demo_pin() -> None:
    card = extract_incident(HazardInputPayload(raw_text="Citizen-only phrase about a leaning sign"))
    assert "RM 620" not in card.summary
    assert card.incident_id != "INC-DEMO01"
    assert card.model_name != "fallback-cache-travis-v1"
