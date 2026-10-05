from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

Category = Literal["ELECTRICAL", "ROAD_OBSTRUCTION", "WATER_FLOODING", "TRAFFIC_SIGNAL", "OTHER"]
Severity = Literal["CRITICAL", "HIGH", "MODERATE", "LOW"]
Agency = Literal["AUSTIN_ENERGY", "COUNTY_PUBLIC_WORKS", "311_DISPATCH", "EMERGENCY_SERVICES"]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_incident_id() -> str:
    return f"INC-{uuid4().hex[:8].upper()}"


class HazardInputPayload(BaseModel):
    raw_text: str = Field(..., min_length=5, max_length=2000, description="Citizen incident description")
    reported_lat: float | None = Field(
        default=None,
        ge=-90.0,
        le=90.0,
        description="WGS84 latitude; null if unknown. Never invented.",
    )
    reported_lng: float | None = Field(
        default=None,
        ge=-180.0,
        le=180.0,
        description="WGS84 longitude; null if unknown. Never invented.",
    )


class IncidentCard(BaseModel):
    incident_id: str = Field(default_factory=new_incident_id)
    timestamp: datetime = Field(default_factory=utcnow)
    category: Category
    severity: Severity
    summary: str
    target_agency: Agency
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
    longitude: float | None = Field(default=None, ge=-180.0, le=180.0)
    model_name: str = Field(..., description="Attribution of model producing extraction")
    image_attached: bool = False


class Austin311Context(BaseModel):
    ticket_count: int | None = Field(
        default=None,
        description="Live SODA count. Null when the feed is down or the category has no filter. Never invented.",
    )
    source: str
    scope: Literal["nearby", "citywide_type", "unavailable"]
    sr_type_filter: str
