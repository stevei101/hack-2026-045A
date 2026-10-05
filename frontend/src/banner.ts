import { AGENCY_LABEL, type IncidentCard } from "./types";
import type { Austin311Context } from "./types";

export function dispatchBannerText(
  incident: IncidentCard,
  context: Austin311Context | null,
): string {
  const head = `${incident.severity}: ${incident.summary} → Routed to ${AGENCY_LABEL[incident.target_agency]}`;
  if (!context || context.ticket_count == null) {
    return head;
  }
  const hasGps = incident.latitude != null && incident.longitude != null;
  if (context.scope === "nearby" && hasGps) {
    return `${head} | Cross-referenced with ${context.ticket_count} nearby Austin 311 tickets`;
  }
  if (context.scope === "citywide_type" || context.scope === "nearby") {
    return `${head} | Cross-referenced with ${context.ticket_count} matching Austin 311 tickets`;
  }
  return head;
}
