export type Category =
  | "ELECTRICAL"
  | "ROAD_OBSTRUCTION"
  | "WATER_FLOODING"
  | "TRAFFIC_SIGNAL"
  | "OTHER";

export type Severity = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export type Agency =
  | "AUSTIN_ENERGY"
  | "COUNTY_PUBLIC_WORKS"
  | "311_DISPATCH"
  | "EMERGENCY_SERVICES";

export type Austin311Scope = "nearby" | "citywide_type" | "unavailable";

export type Austin311Context = {
  ticket_count: number | null;
  source: string;
  scope: Austin311Scope;
  sr_type_filter: string;
};

export type IncidentCard = {
  incident_id: string;
  timestamp: string;
  category: Category;
  severity: Severity;
  summary: string;
  target_agency: Agency;
  confidence_score: number;
  latitude: number | null;
  longitude: number | null;
  model_name: string;
  image_attached: boolean;
};

export const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MODERATE: 2,
  LOW: 3,
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MODERATE: "#F59E0B",
  LOW: "#3B82F6",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  ELECTRICAL: "Electrical",
  ROAD_OBSTRUCTION: "Road obstruction",
  WATER_FLOODING: "Water / flooding",
  TRAFFIC_SIGNAL: "Traffic signal",
  OTHER: "Unclassified",
};

export const AGENCY_LABEL: Record<Agency, string> = {
  AUSTIN_ENERGY: "Austin Energy",
  COUNTY_PUBLIC_WORKS: "County Public Works",
  "311_DISPATCH": "311 Dispatch",
  EMERGENCY_SERVICES: "Emergency Services",
};

export const MAP_CENTER: [number, number] = [30.4015, -97.7164];
export const MAP_ZOOM = 11;

export function isMapped(incident: IncidentCard): boolean {
  return incident.latitude != null && incident.longitude != null;
}

export function sortIncidents(items: IncidentCard[]): IncidentCard[] {
  return [...items].sort((a, b) => {
    const severity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severity !== 0) return severity;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
