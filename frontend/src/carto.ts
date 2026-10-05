const CARTO_HOST = "clausa.app.carto.com";

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

export const CARTO_MAP_URL = lockedCartoMapUrl(import.meta.env.VITE_CARTO_MAP_URL);
