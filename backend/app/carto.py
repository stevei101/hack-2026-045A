from __future__ import annotations

import os
from typing import Literal

from app.models import CartoPublicConfig

DEFAULT_API_BASE_URL = "https://gcp-us-east1.api.carto.com"
CARTO_ORGANIZATION = "hack-2026-045A"
CARTO_ORGANIZATION_ID = "ac_1f2p12xz"
CARTO_DOMAIN = "clausa.app.carto.com"
CARTO_REGION = "United States (East)"


def api_base_url() -> str:
    return os.environ.get("CARTO_API_BASE_URL", DEFAULT_API_BASE_URL).rstrip("/")


def api_access_token() -> str | None:
    token = os.environ.get("CARTO_API_ACCESS_TOKEN", "").strip()
    return token or None


def public_config() -> CartoPublicConfig:
    token = api_access_token()
    status: Literal["missing", "present"] = "present" if token else "missing"
    return CartoPublicConfig(
        api_base_url=api_base_url(),
        organization=CARTO_ORGANIZATION,
        organization_id=CARTO_ORGANIZATION_ID,
        domain=CARTO_DOMAIN,
        region=CARTO_REGION,
        token_status=status,
    )
