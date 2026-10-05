from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

Category = Literal["ELECTRICAL", "ROAD_OBSTRUCTION", "WATER_FLOODING", "TRAFFIC_SIGNAL", "OTHER"]
Severity = Literal["CRITICAL", "HIGH", "MODERATE", "LOW"]
Agency = Literal["AUSTIN_ENERGY", "COUNTY_PUBLIC_WORKS", "311_DISPATCH", "EMERGENCY_SERVICES"]

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class HazardInputPayload(BaseModel):
    raw_text: str = Field(..., min_length=5, max_length=2000)
    reported_lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    reported_lng: Optional[float] = Field(None, ge=-180.0, le=180.0)


class IncidentCard(BaseModel):
    incident_id: str = Field(default_factory=lambda: f"INC-{uuid4().hex[:8].upper()}")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    category: Category
    severity: Severity
    summary: str
    target_agency: Agency
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    model_name: str
    image_attached: bool = False
    address: str = ""
