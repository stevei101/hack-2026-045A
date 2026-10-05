import { dispatchBannerText } from "../banner";
import type { Austin311Context, IncidentCard } from "../types";

type Props = {
  incident: IncidentCard | null;
  context: Austin311Context | null;
};

export function IncidentBanner({ incident, context }: Props) {
  if (!incident) return null;
  return (
    <div
      role="status"
      className="z-20 border-b border-amber-400/30 bg-[#2a1a10]/95 px-4 py-2.5 text-sm text-amber-50 shadow-lg backdrop-blur"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200/80">
        Live triage overlay · FastAPI delta
      </p>
      <p className="mt-0.5 font-medium leading-5">{dispatchBannerText(incident, context)}</p>
      <p className="mt-1 font-mono text-[10px] text-amber-200/70">
        {incident.incident_id} · {incident.model_name}
        {incident.latitude == null || incident.longitude == null
          ? " · unmapped — landmark triage, no invented pin"
          : ""}
      </p>
    </div>
  );
}
