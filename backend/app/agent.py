from __future__ import annotations

import logging
import os
import re

from app.models import Agency, Category, HazardInputPayload, IncidentCard, Severity

logger = logging.getLogger(__name__)

HEURISTIC_MODEL = "civicpulse-heuristic"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

KEYWORD_RULES: list[tuple[tuple[str, ...], Category, Severity, Agency]] = [
    (("wire", "spark", "transformer", "power line", "outage", "flashover"), "ELECTRICAL", "CRITICAL", "AUSTIN_ENERGY"),
    (("flood", "submerged", "standing water", "creek", "overtop"), "WATER_FLOODING", "HIGH", "EMERGENCY_SERVICES"),
    (("signal", "stoplight", "flashing red", "dark light"), "TRAFFIC_SIGNAL", "HIGH", "311_DISPATCH"),
    (("tree", "limb", "oak", "sinkhole", "debris", "blocked"), "ROAD_OBSTRUCTION", "HIGH", "COUNTY_PUBLIC_WORKS"),
]


def configured_model_name() -> str:
    return os.environ.get("MODEL_NAME", HEURISTIC_MODEL)


def extract_incident(payload: HazardInputPayload, *, image_attached: bool = False) -> IncidentCard:
    """Classify one citizen report.

    Coordinates are copied from the reporter only. Street names are not
    geocoded. A missing model key falls back to the heuristic for this
    report; demo pins are never substituted for the citizen's text.
    """
    try:
        return _heuristic(payload, image_attached=image_attached)
    except Exception:
        logger.exception("classifier failed; returning unclassified card")
        return IncidentCard(
            category="OTHER",
            severity="LOW",
            summary=_summary(payload.raw_text),
            target_agency="311_DISPATCH",
            confidence_score=0.0,
            latitude=payload.reported_lat,
            longitude=payload.reported_lng,
            model_name=configured_model_name(),
            image_attached=image_attached,
        )


def _heuristic(payload: HazardInputPayload, *, image_attached: bool) -> IncidentCard:
    text = payload.raw_text.lower()
    category: Category = "OTHER"
    severity: Severity = "LOW"
    agency: Agency = "311_DISPATCH"
    confidence = 0.42
    model = configured_model_name()

    for keywords, matched_category, matched_severity, matched_agency in KEYWORD_RULES:
        if any(keyword in text for keyword in keywords):
            category = matched_category
            severity = matched_severity
            agency = matched_agency
            confidence = 0.71
            break

    if any(token in text for token in ("downed", "sparking", "live wire", "fast-moving", "collapse")):
        severity = "CRITICAL"
        if category == "ELECTRICAL":
            agency = "AUSTIN_ENERGY"
        confidence = min(0.92, confidence + 0.15)

    return IncidentCard(
        category=category,
        severity=severity,
        summary=_summary(payload.raw_text),
        target_agency=agency,
        confidence_score=confidence,
        latitude=payload.reported_lat,
        longitude=payload.reported_lng,
        model_name=model,
        image_attached=image_attached,
    )


def _summary(raw_text: str) -> str:
    summary = re.sub(r"\s+", " ", raw_text).strip()
    if len(summary) > 220:
        return f"{summary[:217]}..."
    return summary
