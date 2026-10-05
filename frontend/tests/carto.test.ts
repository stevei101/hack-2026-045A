import { expect, test } from "bun:test";
import {
  CARTO_ORG,
  OSM_TILE_URL,
  cartoIframeSrc,
  leafletTileLayer,
  lockedCartoMapUrl,
} from "../src/carto";

test("empty env leaves the baseline pane empty", () => {
  expect(lockedCartoMapUrl(undefined)).toBeNull();
  expect(lockedCartoMapUrl("")).toBeNull();
  expect(lockedCartoMapUrl("YOUR_PUBLIC_MAP_UUID")).toBeNull();
});

test("only a public clausa.app.carto.com map URL is accepted", () => {
  const url = "https://clausa.app.carto.com/map/11111111-2222-3333-4444-555555555555";
  expect(lockedCartoMapUrl(url)).toBe(url);
  expect(lockedCartoMapUrl("http://clausa.app.carto.com/map/abc")).toBeNull();
  expect(lockedCartoMapUrl("https://example.com/map/abc")).toBeNull();
});

test("org constants point at the US-East Cloud tenant", () => {
  expect(CARTO_ORG.apiBaseUrl).toBe("https://gcp-us-east1.api.carto.com");
  expect(CARTO_ORG.organization).toBe("hack-2026-045A");
  expect(CARTO_ORG.organizationId).toBe("ac_1f2p12xz");
  expect(CARTO_ORG.domain).toBe("clausa.app.carto.com");
});

test("live overlay uses OSM until a Basemaps key exists", () => {
  const open = leafletTileLayer(undefined);
  expect(open.url).toBe(OSM_TILE_URL);
  expect(open.url.includes("basemaps.cartocdn.com")).toBe(false);
  const keyed = leafletTileLayer("not-a-real-key");
  expect(keyed.url.includes("basemaps.cartocdn.com")).toBe(true);
  expect(keyed.url.includes("key=not-a-real-key")).toBe(true);
});

test("iframe src never receives incident coordinates", () => {
  const locked = "https://clausa.app.carto.com/map/11111111-2222-3333-4444-555555555555";
  const src = cartoIframeSrc(locked);
  expect(src).toBe(locked);
  expect(src.includes("lat=")).toBe(false);
  expect(src.includes("30.3150")).toBe(false);
  expect(src.includes("30.4515")).toBe(false);
});
