export const CATEGORIES = [
  "ELECTRICAL",
  "WATER_FLOODING",
  "ROAD_OBSTRUCTION",
  "TRAFFIC_SIGNAL",
  "OTHER",
] as const

export const SEVERITIES = ["CRITICAL", "HIGH", "MODERATE", "LOW"] as const

export const AGENCIES = [
  "AUSTIN_ENERGY",
  "COUNTY_PUBLIC_WORKS",
  "311_DISPATCH",
  "EMERGENCY_SERVICES",
] as const

export type Category = (typeof CATEGORIES)[number]
export type Severity = (typeof SEVERITIES)[number]
export type Agency = (typeof AGENCIES)[number]

export type Incident = {
  incident_id: string
  category: Category
  severity: Severity
  summary: string
  target_agency: Agency
  confidence_score: number
  latitude: number | null
  longitude: number | null
  address: string
  timestamp: string
  model_name: string
}

export const MAP_CENTER: [number, number] = [30.4515, -97.6364]

export const SEED_INCIDENTS: Incident[] = [
  {
    incident_id: "INC-1001",
    category: "ELECTRICAL",
    severity: "CRITICAL",
    summary: "Downed live oak limbs sagging directly across transformer wires.",
    target_agency: "AUSTIN_ENERGY",
    confidence_score: 0.98,
    latitude: 30.4398,
    longitude: -97.62,
    address: "Pecan St & Swenson Blvd, Pflugerville",
    timestamp: "12 mins ago",
    model_name: "fallback-cache-travis-v1",
  },
  {
    incident_id: "INC-1002",
    category: "WATER_FLOODING",
    severity: "HIGH",
    summary: "Submerged roadway dip with 12+ inches standing storm water.",
    target_agency: "COUNTY_PUBLIC_WORKS",
    confidence_score: 0.95,
    latitude: 30.4485,
    longitude: -97.665,
    address: "Wells Branch Pkwy near Heatherwilde",
    timestamp: "24 mins ago",
    model_name: "fallback-cache-travis-v1",
  },
  {
    incident_id: "INC-1003",
    category: "TRAFFIC_SIGNAL",
    severity: "CRITICAL",
    summary: "Intersection traffic light blackout following storm surge.",
    target_agency: "311_DISPATCH",
    confidence_score: 0.99,
    latitude: 30.461,
    longitude: -97.598,
    address: "SH-130 & Grand Avenue Pkwy",
    timestamp: "35 mins ago",
    model_name: "fallback-cache-travis-v1",
  },
  {
    incident_id: "INC-1004",
    category: "ROAD_OBSTRUCTION",
    severity: "MODERATE",
    summary: "Spilled construction gravel hazard across right lane.",
    target_agency: "COUNTY_PUBLIC_WORKS",
    confidence_score: 0.91,
    latitude: 30.489,
    longitude: -97.652,
    address: "Louis Henna Blvd & A.W. Grimes, Round Rock",
    timestamp: "1 hour ago",
    model_name: "fallback-cache-travis-v1",
  },
  {
    incident_id: "INC-1005",
    category: "WATER_FLOODING",
    severity: "LOW",
    summary: "Clogged storm drain inlet with heavy leaf buildup.",
    target_agency: "311_DISPATCH",
    confidence_score: 0.88,
    latitude: 30.4635,
    longitude: -97.589,
    address: "Speidel Dr / Blackhawk Links, Pflugerville",
    timestamp: "2 hours ago",
    model_name: "fallback-cache-travis-v1",
  },
  {
    incident_id: "INC-1006",
    category: "ELECTRICAL",
    severity: "CRITICAL",
    summary: "Sparking underground utility vault door exposed.",
    target_agency: "AUSTIN_ENERGY",
    confidence_score: 0.97,
    latitude: 30.38,
    longitude: -97.689,
    address: "N Lamar Blvd & Braker Ln, Austin",
    timestamp: "2 hours ago",
    model_name: "fallback-cache-travis-v1",
  },
  {
    incident_id: "INC-1007",
    category: "ROAD_OBSTRUCTION",
    severity: "MODERATE",
    summary: "Pothole caved in over road shoulder drainage culvert.",
    target_agency: "COUNTY_PUBLIC_WORKS",
    confidence_score: 0.92,
    latitude: 30.505,
    longitude: -97.732,
    address: "Parmer Ln & Brushy Creek Rd, Cedar Park",
    timestamp: "3 hours ago",
    model_name: "fallback-cache-travis-v1",
  },
  {
    incident_id: "INC-1008",
    category: "OTHER",
    severity: "LOW",
    summary: "Damaged structural street sign leaning over sidewalk.",
    target_agency: "311_DISPATCH",
    confidence_score: 0.86,
    latitude: 30.542,
    longitude: -97.551,
    address: "US-79 & Chris Kelley Blvd, Hutto",
    timestamp: "4 hours ago",
    model_name: "fallback-cache-travis-v1",
  },
]

export const PRESETS = [
  {
    id: 1,
    text: "Power lines sagging and sparking near tree branch after heavy gust on Pflugerville Pkwy near Kelly Ln.",
    imageName: "downed_wire_pflugerville_pkwy.jpg",
  },
  {
    id: 2,
    text: "Severe water pooling under FM 685 bridge overpass. Cars turning around, ditch overflowing.",
    imageName: "flooded_overpass_fm685.jpg",
  },
] as const

const SIMULATOR_MODEL = "local-draft-simulator"

export function nextIncidentId(existingCount: number): string {
  return `INC-${1000 + existingCount + 1}`
}

/** Local stand-in when the intake API is down. Coordinates stay null unless the browser already has them. */
export function simulateReport(
  text: string,
  existingCount: number,
  latitude: number | null = null,
  longitude: number | null = null,
): Incident {
  const electrical = text.includes("Power")
  return {
    incident_id: nextIncidentId(existingCount),
    category: electrical ? "ELECTRICAL" : "WATER_FLOODING",
    severity: electrical ? "CRITICAL" : "HIGH",
    summary: text,
    target_agency: electrical ? "AUSTIN_ENERGY" : "COUNTY_PUBLIC_WORKS",
    confidence_score: 0.98,
    latitude,
    longitude,
    address: "",
    timestamp: "Just now",
    model_name: SIMULATOR_MODEL,
  }
}

export function incidentFromApi(value: unknown): Incident | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  const category = row.category
  const severity = row.severity
  const agency = row.target_agency
  if (typeof category !== "string" || !CATEGORIES.includes(category as Category)) return null
  if (typeof severity !== "string" || !SEVERITIES.includes(severity as Severity)) return null
  if (typeof agency !== "string" || !AGENCIES.includes(agency as Agency)) return null
  if (typeof row.incident_id !== "string" || typeof row.summary !== "string") return null
  const latitude = typeof row.latitude === "number" ? row.latitude : null
  const longitude = typeof row.longitude === "number" ? row.longitude : null
  return {
    incident_id: row.incident_id,
    category: category as Category,
    severity: severity as Severity,
    summary: row.summary,
    target_agency: agency as Agency,
    confidence_score: typeof row.confidence_score === "number" ? row.confidence_score : 0,
    latitude,
    longitude,
    address: typeof row.address === "string" ? row.address : "",
    timestamp: typeof row.timestamp === "string" ? row.timestamp : "Just now",
    model_name: typeof row.model_name === "string" ? row.model_name : "local-rules-v1",
  }
}

export function isMapped(incident: Incident): incident is Incident & { latitude: number; longitude: number } {
  return incident.latitude !== null && incident.longitude !== null
}

export function categoryLabel(category: Category): string {
  switch (category) {
    case "ELECTRICAL":
      return "Electrical"
    case "WATER_FLOODING":
      return "Flooding"
    case "ROAD_OBSTRUCTION":
      return "Road"
    case "TRAFFIC_SIGNAL":
      return "Signal"
    case "OTHER":
      return "Other"
  }
}

export function categoryMark(category: Category): string {
  switch (category) {
    case "ELECTRICAL":
      return "⚡"
    case "WATER_FLOODING":
      return "🌊"
    case "ROAD_OBSTRUCTION":
      return "🚧"
    case "TRAFFIC_SIGNAL":
      return "🚦"
    case "OTHER":
      return "⚠️"
  }
}

export function severityClass(severity: Severity): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-600"
    case "HIGH":
      return "bg-orange-500"
    case "MODERATE":
      return "bg-amber-500"
    case "LOW":
      return "bg-emerald-600"
  }
}

export function severityBadge(severity: Severity): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-950 text-red-400 border-red-800"
    case "HIGH":
      return "bg-orange-950 text-orange-400 border-orange-800"
    case "MODERATE":
      return "bg-amber-950 text-amber-400 border-amber-800"
    case "LOW":
      return "bg-emerald-950 text-emerald-400 border-emerald-800"
  }
}
