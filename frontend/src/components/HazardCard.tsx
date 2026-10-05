import { AGENCY_LABEL, CATEGORY_LABEL, isMapped, type IncidentCard } from "../types";
import { SeverityBadge } from "./SeverityBadge";

type Props = {
  incident: IncidentCard;
  selected: boolean;
  onSelect: (incident: IncidentCard) => void;
};

export function HazardCard({ incident, selected, onSelect }: Props) {
  const mapped = isMapped(incident);
  return (
    <button
      type="button"
      onClick={() => onSelect(incident)}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? "border-teal-300/60 bg-teal-300/10"
          : "border-[#243049] bg-[#101827] hover:border-[#3a4d6e]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] tracking-wide text-[#8b9bb3]">{incident.incident_id}</p>
        <SeverityBadge severity={incident.severity} compact />
      </div>
      <p className="mt-2 text-sm leading-5 text-[#e8eef8]">{incident.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#8b9bb3]">
        <span className="rounded bg-[#162033] px-2 py-0.5">{CATEGORY_LABEL[incident.category]}</span>
        <span>{AGENCY_LABEL[incident.target_agency]}</span>
        <span>{mapped ? "Mapped" : "Needs triage"}</span>
        {incident.image_attached ? <span>Photo on file</span> : null}
      </div>
      <p className="mt-2 font-mono text-[10px] text-[#6d7d96]">
        {incident.model_name} · {Math.round(incident.confidence_score * 100)}% confidence
      </p>
    </button>
  );
}
