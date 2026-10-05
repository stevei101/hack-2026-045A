const CARTO_HOST = "clausa.app.carto.com";

export const CARTO_ORG = {
  apiBaseUrl: (import.meta.env.VITE_CARTO_API_BASE_URL ?? "https://gcp-us-east1.api.carto.com").replace(
    /\/$/,
    "",
  ),
  organization: "hack-2026-045A",
  organizationId: "ac_1f2p12xz",
  domain: CARTO_HOST,
  region: "United States (East)",
} as const;

export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function lockedCartoMapUrl(raw: string | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== CARTO_HOST) return null;
    if (!url.pathname.startsWith("/map/")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** iframe src is the published map only. Incident GPS never mutates it. */
export function cartoIframeSrc(locked: string): string {
  return locked;
}

/**
 * Live-overlay raster tiles. CARTO CDN dark tiles watermark without a
 * separate Basemaps key (not the Cloud API Access Token). OSM needs no key.
 */
export function leafletTileLayer(basemapsKey: string | undefined): {
  url: string;
  attribution: string;
} {
  const key = (basemapsKey ?? "").trim();
  if (!key) {
    return { url: OSM_TILE_URL, attribution: OSM_TILE_ATTRIBUTION };
  }
  return {
    url: `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  };
}

export const CARTO_MAP_URL = lockedCartoMapUrl(import.meta.env.VITE_CARTO_MAP_URL);
export const LEAFLET_TILES = leafletTileLayer(import.meta.env.VITE_CARTO_BASEMAPS_KEY);
