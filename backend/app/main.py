from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.agent import ALLOWED_IMAGE_TYPES, extract_incident
from app.austin311 import query_ticket_count
from app.carto import public_config
from app.mock_data import demo_incidents
from app.models import Austin311Context, CartoPublicConfig, Category, HazardInputPayload, IncidentCard

FRONTEND_DIST = Path(os.environ.get("FRONTEND_DIST", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
incidents: list[IncidentCard] = demo_incidents()

DEFAULT_ORIGINS = [
    "http://127.0.0.1:43211",
    "http://localhost:43211",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://hack.oxidizedgraph.dev",
]


def cors_origins() -> list[str]:
    extra = os.environ.get("CORS_ORIGINS", "")
    values = [item.strip() for item in extra.split(",") if item.strip()]
    return DEFAULT_ORIGINS + values


app = FastAPI(
    title="CivicPulse Mesh",
    version="0.1.0",
    description="WarriorHacks 2026-045A hazard intake for Travis and Williamson counties.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "civicpulse-mesh"}


@app.get("/readyz")
def readyz() -> dict[str, str]:
    return {"status": "ready"}


@app.get("/api/v1/incidents", response_model=list[IncidentCard])
def list_incidents() -> list[IncidentCard]:
    return incidents


@app.get("/api/v1/carto/config", response_model=CartoPublicConfig)
def carto_config() -> CartoPublicConfig:
    return public_config()


@app.get("/api/v1/austin311/context", response_model=Austin311Context)
def austin311_context(
    category: Category,
    lat: float | None = None,
    lng: float | None = None,
) -> Austin311Context:
    if (lat is None) ^ (lng is None):
        lat = None
        lng = None
    return query_ticket_count(category=category, lat=lat, lng=lng)


@app.post("/api/v1/hazards/report", response_model=IncidentCard)
async def report_hazard(
    raw_text: str = Form(...),
    lat: float | None = Form(default=None),
    lng: float | None = Form(default=None),
    image: UploadFile | None = File(default=None),
) -> IncidentCard:
    image_attached = bool(image and image.filename)
    if image is not None and image.filename:
        content_type = (image.content_type or "").lower()
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail="Unsupported media type")
        await image.read()

    payload = HazardInputPayload(raw_text=raw_text, reported_lat=lat, reported_lng=lng)
    card = extract_incident(payload, image_attached=image_attached)
    incidents.insert(0, card)
    return card


if FRONTEND_DIST.exists():
    assets = FRONTEND_DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/")
    def spa_index() -> FileResponse:
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str) -> FileResponse:
        if full_path.startswith("api/") or full_path in {"healthz", "readyz"}:
            raise HTTPException(status_code=404, detail="Not found")
        candidate = FRONTEND_DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
