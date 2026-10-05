import io
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.agent import apply_reported_point, classify_text, fallback_card, model_configured, unclassified
from app.mock_data import SEEDED_INCIDENTS
from app.models import IMAGE_TYPES, IncidentCard

app = FastAPI(title="CivicPulse Mesh")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/readyz")
def readyz() -> dict[str, str]:
    return {"status": "ready"}


@app.get("/api/v1/hazards")
def list_hazards() -> list[IncidentCard]:
    return SEEDED_INCIDENTS


def _image_bytes(upload: UploadFile) -> bytes:
    content_type = (upload.content_type or "").split(";")[0].strip().lower()
    if content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="image must be jpeg, png, or webp")
    payload = upload.file.read()
    buffer = io.BytesIO(payload)
    sniffed = buffer.read(16)
    if content_type == "image/jpeg" and not sniffed.startswith(b"\xff\xd8"):
        raise HTTPException(status_code=415, detail="jpeg payload does not match")
    if content_type == "image/png" and not sniffed.startswith(b"\x89PNG"):
        raise HTTPException(status_code=415, detail="png payload does not match")
    if content_type == "image/webp" and sniffed[8:12] != b"WEBP":
        raise HTTPException(status_code=415, detail="webp payload does not match")
    return payload


@app.post("/api/v1/hazards/report")
def report_hazard(
    raw_text: str = Form(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
) -> IncidentCard:
    if len(raw_text.strip()) < 5 or len(raw_text) > 2000:
        raise HTTPException(status_code=422, detail="raw_text must be 5 to 2000 characters")
    attached = False
    if image is not None and image.filename:
        _image_bytes(image)
        attached = True
    point_lat = lat
    point_lng = lng
    if (point_lat is None) ^ (point_lng is None):
        point_lat = None
        point_lng = None
    try:
        if model_configured():
            raise RuntimeError("configured model endpoint is not called from this build")
        card = classify_text(raw_text)
    except ValidationError:
        card = unclassified(raw_text, "fallback-cache-travis-v1")
    except Exception:
        card = fallback_card(raw_text)
    return apply_reported_point(card, point_lat, point_lng, attached)
