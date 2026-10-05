import { isMapped, sortIncidents, type IncidentCard } from "../types";
import { HazardCard } from "./HazardCard";

type Props = {
  incidents: IncidentCard[];
  selectedId: string | null;
  onSelect: (incident: IncidentCard) => void;
  embedded?: boolean;
};

export function TriageDrawer({ incidents, selectedId, onSelect, embedded = false }: Props) {
  const ranked = sortIncidents(incidents);
  const unmapped = ranked.filter((item) => !isMapped(item));
  const mapped = ranked.filter((item) => isMapped(item));

  return (
    <aside
      className={
        embedded
          ? "flex min-h-0 flex-1 flex-col border-t border-[#243049] bg-transparent"
          : "flex h-full min-h-0 flex-col border-l border-[#243049] bg-[#0b1220]/95 backdrop-blur"
      }
    >
      <div className="border-b border-[#243049] px-4 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal-300">Triage queue</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Active hazards</h2>
        <p className="mt-1 text-sm text-[#8b9bb3]">
          {mapped.length} mapped · {unmapped.length} unmapped · Travis and Williamson
        </p>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#f59e0b]">
              Unmapped incidents — needs triage
            </h3>
            <span className="font-mono text-[11px] text-[#8b9bb3]">{unmapped.length}</span>
          </div>
          {unmapped.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#243049] px-3 py-4 text-sm text-[#8b9bb3]">
              No reports are waiting without coordinates.
            </p>
          ) : (
            <div className="space-y-2">
              {unmapped.map((incident) => (
                <HazardCard
                  key={incident.incident_id}
                  incident={incident}
                  selected={incident.incident_id === selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8b9bb3]">Mapped pins</h3>
            <span className="font-mono text-[11px] text-[#8b9bb3]">{mapped.length}</span>
          </div>
          {mapped.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#243049] px-3 py-4 text-sm text-[#8b9bb3]">
              The map is empty until a report includes GPS or a demo pin loads.
            </p>
          ) : (
            <div className="space-y-2">
              {mapped.map((incident) => (
                <HazardCard
                  key={incident.incident_id}
                  incident={incident}
                  selected={incident.incident_id === selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
