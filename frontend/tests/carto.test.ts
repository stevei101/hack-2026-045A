import { expect, test } from "bun:test";
import { cartoIframeSrc, lockedCartoMapUrl } from "../src/carto";

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

test("iframe src never receives incident coordinates", () => {
  const locked = "https://clausa.app.carto.com/map/11111111-2222-3333-4444-555555555555";
  const src = cartoIframeSrc(locked);
  expect(src).toBe(locked);
  expect(src.includes("lat=")).toBe(false);
  expect(src.includes("30.3150")).toBe(false);
  expect(src.includes("30.4515")).toBe(false);
});
