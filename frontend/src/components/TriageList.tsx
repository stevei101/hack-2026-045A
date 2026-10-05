import { severityBadge, type Category, type Incident } from "../incidents.ts"

const FILTERS: Array<{ id: "ALL" | Category; label: string }> = [
  { id: "ALL", label: "ALL" },
  { id: "ELECTRICAL", label: "Electrical" },
  { id: "WATER_FLOODING", label: "Flooding" },
  { id: "ROAD_OBSTRUCTION", label: "Road" },
  { id: "TRAFFIC_SIGNAL", label: "Signal" },
]

type TriageListProps = {
  incidents: Incident[]
  query: string
  category: "ALL" | Category
  selectedId: string | null
  onQuery: (value: string) => void
  onCategory: (value: "ALL" | Category) => void
  onSelect: (id: string) => void
}

export function filterIncidents(
  incidents: Incident[],
  query: string,
  category: "ALL" | Category,
): Incident[] {
  const needle = query.trim().toLowerCase()
  return incidents.filter((incident) => {
    const categoryOk = category === "ALL" || incident.category === category
    const haystack = `${incident.summary} ${incident.address} ${incident.target_agency} ${incident.incident_id}`.toLowerCase()
    return categoryOk && (needle.length === 0 || haystack.includes(needle))
  })
}

export function TriageList({
  incidents,
  query,
  category,
  selectedId,
  onQuery,
  onCategory,
  onSelect,
}: TriageListProps) {
  const visible = filterIncidents(incidents, query, category)
  const unmapped = visible.filter((incident) => incident.latitude === null || incident.longitude === null)

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">Triage incident drawer</span>
          <span className="rounded border border-brand-700 bg-brand-900/60 px-2 py-0.5 font-mono text-xs text-brand-100">
            {visible.length} listed
          </span>
        </div>
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search hazard, location, or agency"
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onCategory(filter.id)}
              className={
                category === filter.id
                  ? "rounded bg-brand-500 px-2.5 py-1 font-semibold text-white"
                  : "rounded bg-slate-800 px-2.5 py-1 text-slate-400 hover:text-slate-200"
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
        {unmapped.length > 0 && (
          <p className="rounded-lg border border-amber-800 bg-amber-950/40 px-3 py-2 text-[11px] text-amber-200">
            Unmapped incidents, needs triage: {unmapped.map((item) => item.incident_id).join(", ")}
          </p>
        )}
        {visible.map((incident) => {
          const selected = incident.incident_id === selectedId
          return (
            <button
              key={incident.incident_id}
              type="button"
              onClick={() => onSelect(incident.incident_id)}
              className={`w-full space-y-2 rounded-xl border p-3.5 text-left text-xs transition ${
                selected ? "border-brand-500 bg-slate-800/90 shadow-md" : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-200">{incident.incident_id}</span>
                  <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${severityBadge(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">{incident.timestamp}</span>
              </div>
              <p className="text-xs leading-snug font-semibold text-slate-200">{incident.summary}</p>
              <div className="flex items-center justify-between border-t border-slate-800 pt-1 text-[11px] text-slate-400">
                <span>{incident.address}</span>
                <span className="font-mono font-medium text-brand-500">{incident.target_agency}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
