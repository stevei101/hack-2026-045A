import { describe, expect, test } from "bun:test"
import { SEED_INCIDENTS, nextIncidentId, simulateReport } from "./incidents.ts"

describe("draft simulator", () => {
  test("keeps the eight seed pins mapped", () => {
    expect(SEED_INCIDENTS).toHaveLength(8)
    expect(SEED_INCIDENTS.filter((item) => item.severity === "CRITICAL")).toHaveLength(3)
    for (const incident of SEED_INCIDENTS) {
      expect(incident.latitude).not.toBeNull()
      expect(incident.longitude).not.toBeNull()
    }
  })

  test("classifies the power preset as electrical and numbers the next id", () => {
    const created = simulateReport("Power lines sagging", SEED_INCIDENTS.length)
    expect(created.incident_id).toBe("INC-1009")
    expect(nextIncidentId(8)).toBe("INC-1009")
    expect(created.category).toBe("ELECTRICAL")
    expect(created.severity).toBe("CRITICAL")
    expect(created.target_agency).toBe("AUSTIN_ENERGY")
    expect(created.model_name).toBe("local-draft-simulator")
    expect(created.latitude).toBeNull()
    expect(created.longitude).toBeNull()
  })

  test("classifies other text as flooding", () => {
    const created = simulateReport("Water over the roadway", 8)
    expect(created.category).toBe("WATER_FLOODING")
    expect(created.severity).toBe("HIGH")
    expect(created.target_agency).toBe("COUNTY_PUBLIC_WORKS")
  })
})
