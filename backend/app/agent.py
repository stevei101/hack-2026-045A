import os
from typing import Optional

from pydantic import ValidationError

from app.mock_data import FALLBACK_MODEL
from app.models import Agency, Category, IncidentCard, Severity

RULES_MODEL = "local-rules-v1"


def classify_text(text: str) -> IncidentCard:
    lowered = text.lower()
    category: Category = "OTHER"
    severity: Severity = "LOW"
    agency: Agency = "311_DISPATCH"
    confidence = 0.55

    if any(word in lowered for word in ("wire", "power", "transformer", "spark", "electrical", "utility vault")):
        category = "ELECTRICAL"
        agency = "AUSTIN_ENERGY"
        severity = "CRITICAL" if any(word in lowered for word in ("spark", "downed", "live", "sagging", "flash")) else "HIGH"
        confidence = 0.9
    elif any(word in lowered for word in ("flood", "water", "submerged", "culvert", "pooling")):
        category = "WATER_FLOODING"
        fast = any(word in lowered for word in ("submerged", "fast-moving", "fast moving", "over the road"))
        agency = "EMERGENCY_SERVICES" if fast else "COUNTY_PUBLIC_WORKS"
        severity = "CRITICAL" if fast else "HIGH"
        confidence = 0.88
    elif any(word in lowered for word in ("signal", "traffic light", "blackout")):
        category = "TRAFFIC_SIGNAL"
        agency = "311_DISPATCH"
        severity = "CRITICAL" if any(word in lowered for word in ("dark", "blackout")) else "HIGH"
        confidence = 0.86
    elif any(word in lowered for word in ("sinkhole", "pothole", "gravel", "collapse", "obstruction", "limb", "oak")):
        category = "ROAD_OBSTRUCTION"
        agency = "COUNTY_PUBLIC_WORKS"
        severity = "CRITICAL" if "collapse" in lowered else "MODERATE"
        confidence = 0.84

    return IncidentCard(
        category=category,
        severity=severity,
        summary=text.strip(),
        target_agency=agency,
        confidence_score=confidence,
        latitude=None,
        longitude=None,
        model_name=RULES_MODEL,
    )


def card_from_model_payload(payload: object, summary: str) -> IncidentCard:
    if not isinstance(payload, dict):
        raise ValueError("model payload must be an object")
    data = dict(payload)
    data.pop("latitude", None)
    data.pop("longitude", None)
    data.setdefault("summary", summary)
    data.setdefault("model_name", "unspecified-model")
    return IncidentCard.model_validate(data)


def unclassified(summary: str, model_name: str) -> IncidentCard:
    return IncidentCard(
        category="OTHER",
        severity="LOW",
        summary=summary.strip(),
        target_agency="311_DISPATCH",
        confidence_score=0.0,
        latitude=None,
        longitude=None,
        model_name=model_name,
    )


def apply_reported_point(card: IncidentCard, lat: Optional[float], lng: Optional[float], image_attached: bool) -> IncidentCard:
    return card.model_copy(update={"latitude": lat, "longitude": lng, "image_attached": image_attached})


def model_configured() -> bool:
    return bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY"))


def card_or_unclassified(payload: object, summary: str) -> IncidentCard:
    try:
        return card_from_model_payload(payload, summary)
    except (ValidationError, ValueError):
        return unclassified(summary, FALLBACK_MODEL)


def fallback_card(summary: str) -> IncidentCard:
    card = classify_text(summary)
    return card.model_copy(update={"model_name": FALLBACK_MODEL, "latitude": None, "longitude": None})
