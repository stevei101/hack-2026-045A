import { expect, test } from "bun:test";
import { dispatchBannerText } from "../src/banner";
import type { Austin311Context, IncidentCard } from "../src/types";

const incident: IncidentCard = {
  incident_id: "INC-TEST01",
  timestamp: "2026-10-05T00:00:00Z",
  category: "ELECTRICAL",
  severity: "CRITICAL",
  summary: "Live wires down on Lamar Blvd",
  target_agency: "AUSTIN_ENERGY",
  confidence_score: 0.9,
  latitude: null,
  longitude: null,
  model_name: "civicpulse-heuristic",
  image_attached: false,
};

test("omits a ticket clause when SODA did not return a count", () => {
  const text = dispatchBannerText(incident, null);
  expect(text).toContain("Routed to Austin Energy");
  expect(text.includes("47")).toBe(false);
  expect(text.includes("Cross-referenced")).toBe(false);
});

test("uses the live nearby count instead of a hardcoded total", () => {
  const context: Austin311Context = {
    ticket_count: 12,
    source: "data.austintexas.gov/resource/xwdj-i9he",
    scope: "nearby",
    sr_type_filter: "ELECTRICAL",
  };
  const text = dispatchBannerText(incident, context);
  expect(text).toContain("12 nearby Austin 311 tickets");
  expect(text.includes("47 nearby")).toBe(false);
});

test("citywide type match is labeled as matching, not nearby", () => {
  const context: Austin311Context = {
    ticket_count: 81,
    source: "data.austintexas.gov/resource/xwdj-i9he",
    scope: "citywide_type",
    sr_type_filter: "ELECTRICAL",
  };
  expect(dispatchBannerText(incident, context)).toContain("81 matching Austin 311 tickets");
});
