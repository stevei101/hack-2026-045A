from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Literal

from app.models import Austin311Context, Category

logger = logging.getLogger(__name__)

SODA_RESOURCE = "https://data.austintexas.gov/resource/xwdj-i9he.json"
SODA_SOURCE = "data.austintexas.gov/resource/xwdj-i9he"
NEARBY_RADIUS_M = 3200
NEARBY_BOX_DEG = 0.03
REQUEST_TIMEOUT_S = 8

Scope = Literal["nearby", "citywide_type", "unavailable"]

# Tokens only — never interpolate citizen text into SoQL.
CATEGORY_CLAUSES: dict[Category, str] = {
    "ELECTRICAL": (
        "upper(sr_type_desc) like '%STREET LIGHT%'"
        " OR upper(sr_type_desc) like '%POWER%'"
        " OR upper(sr_type_desc) like '%OUTAGE%'"
    ),
    "ROAD_OBSTRUCTION": (
        "upper(sr_type_desc) like '%OBSTRUCTION%'"
        " OR upper(sr_type_desc) like '%DEBRIS IN STREET%'"
        " OR upper(sr_type_desc) like '%TREE ISSUE%'"
    ),
    "WATER_FLOODING": "upper(sr_type_desc) like '%FLOOD%'",
    "TRAFFIC_SIGNAL": "upper(sr_type_desc) like '%TRAFFIC SIGNAL%'",
    "OTHER": "",
}

EXPORT_WHERE = (
    "upper(sr_type_desc) like '%OBSTRUCTION%'"
    " OR upper(sr_type_desc) like '%FLOOD%'"
    " OR upper(sr_type_desc) like '%TREE ISSUE%'"
    " OR upper(sr_type_desc) like '%TRAFFIC SIGNAL%'"
    " OR upper(sr_type_desc) like '%DEBRIS IN STREET%'"
)


def query_ticket_count(
    *,
    category: Category,
    lat: float | None,
    lng: float | None,
) -> Austin311Context:
    """Return a live SODA count, or omit it. Never invent a ticket total."""
    clause = CATEGORY_CLAUSES.get(category, "")
    if not clause:
        return Austin311Context(
            ticket_count=None,
            source=SODA_SOURCE,
            scope="unavailable",
            sr_type_filter=category,
        )

    where = f"({clause})"
    scope: Scope = "citywide_type"
    if lat is not None and lng is not None:
        where = f"{where} AND {nearby_clause(lat, lng)}"
        scope = "nearby"

    try:
        count = soda_count(where)
    except Exception:
        logger.exception("Austin 311 SODA count failed")
        return Austin311Context(
            ticket_count=None,
            source=SODA_SOURCE,
            scope="unavailable",
            sr_type_filter=category,
        )

    return Austin311Context(
        ticket_count=count,
        source=SODA_SOURCE,
        scope=scope,
        sr_type_filter=category,
    )


def nearby_clause(lat: float, lng: float) -> str:
    """Spatial filter from reporter GPS only. No default city point."""
    return (
        f"within_circle(sr_location_lat_long, {lat:.6f}, {lng:.6f}, {NEARBY_RADIUS_M})"
        f" OR ({box_clause(lat, lng)})"
    )


def box_clause(lat: float, lng: float) -> str:
    south, north = lat - NEARBY_BOX_DEG, lat + NEARBY_BOX_DEG
    west, east = lng - NEARBY_BOX_DEG, lng + NEARBY_BOX_DEG
    return (
        f"sr_location_lat between {south:.6f} and {north:.6f}"
        f" AND sr_location_long between {west:.6f} and {east:.6f}"
    )


def soda_count(where: str) -> int:
    query = urllib.parse.urlencode({"$select": "count(*) as ticket_count", "$where": where})
    payload = soda_get(f"{SODA_RESOURCE}?{query}")
    if not payload:
        raise ValueError("empty SODA count payload")
    raw = payload[0].get("ticket_count", payload[0].get("count"))
    return int(raw)


def soda_get(url: str) -> list[dict[str, object]]:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "civicpulse-mesh/0.1 (WarriorHacks 2026-045A)",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_S) as response:
            body = response.read()
    except urllib.error.URLError as exc:
        raise RuntimeError("SODA request failed") from exc
    parsed = json.loads(body.decode("utf-8"))
    if not isinstance(parsed, list):
        raise ValueError("SODA response was not a list")
    return parsed
