import { useEffect, useMemo, useState } from "react"
import { AnalyticsPanel } from "./components/AnalyticsPanel.tsx"
import { HazardMap } from "./components/HazardMap.tsx"
import { IntakeModal } from "./components/IntakeModal.tsx"
import { TriageList } from "./components/TriageList.tsx"
import { SEED_INCIDENTS, incidentFromApi, type Category, type Incident } from "./incidents.ts"

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS)
  const [selectedId, setSelectedId] = useState<string>("INC-1001")
  const [panToken, setPanToken] = useState(0)
  const [recenterToken, setRecenterToken] = useState(0)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<"ALL" | Category>("ALL")
  const [intakeOpen, setIntakeOpen] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [intakeLabel, setIntakeLabel] = useState("Seed cache")

  useEffect(() => {
    let cancelled = false
    void fetch("/api/v1/hazards")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("hazards"))))
      .then((payload: unknown) => {
        if (cancelled || !Array.isArray(payload)) return
        const rows = payload.map(incidentFromApi).filter((item): item is Incident => item !== null)
        if (rows.length === 0) return
        setIncidents(rows)
        setIntakeLabel("Intake API")
      })
      .catch(() => {
        if (!cancelled) setIntakeLabel("Seed cache")
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selected = useMemo(
    () => incidents.find((item) => item.incident_id === selectedId) ?? null,
    [incidents, selectedId],
  )
  const criticalCount = incidents.filter((item) => item.severity === "CRITICAL").length

  function selectIncident(id: string, pan: boolean) {
    setSelectedId(id)
    if (pan) setPanToken((value) => value + 1)
  }

  return (
    <div className="flex min-h-screen flex-col font-sans text-slate-100 antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900 shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-brand-500 px-2.5 py-1 font-mono text-lg font-bold text-white">CPM</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base leading-tight font-bold text-slate-100 sm:text-lg">CivicPulse Mesh</h1>
                <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">v0.1-draft-zero</span>
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">Travis and Williamson County hazard triage</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-slate-300">{intakeLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setIntakeOpen(true)}
              className="rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Submit hazard report
            </button>
          </div>
        </div>
      </header>
      <div className="border-b border-slate-800 bg-slate-850 py-2 text-[11px] text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Public Discord and Devpost only. Two-adult rule for any session with a minor.</p>
          <p className="font-mono text-[10px] text-slate-400">
            stevei101/hack-2026-045A · Flux path k8s/overlays/prod · Deadline Oct 13, 11:45 PM CDT
          </p>
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Active hazards" value={String(incidents.length)} detail="Travis and Williamson samples" />
          <Stat label="Critical severity" value={String(criticalCount)} detail="Needs dispatch" tone="text-red-400" />
          <Stat label="Intake" value={intakeLabel === "Intake API" ? "API" : "Local"} detail="No model key in the browser" tone="text-emerald-400" />
          <Stat label="Target agencies" value="4" detail="Energy, works, 311, EMS" />
        </section>
        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3">
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">Live geographic mesh</span>
              <button
                type="button"
                onClick={() => setRecenterToken((value) => value + 1)}
                className="rounded bg-slate-800 px-2 py-1 font-mono text-[11px] text-slate-300"
              >
                Sample corridor
              </button>
            </div>
            <div className="relative h-[460px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-lg sm:h-[520px]">
              <HazardMap
                incidents={incidents}
                selectedId={selectedId}
                panToken={panToken}
                recenterToken={recenterToken}
                onSelect={(id) => selectIncident(id, false)}
              />
              <div className="absolute bottom-3 left-3 z-[400] space-y-1 rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-[10px] backdrop-blur">
                <div className="mb-1 font-bold text-slate-300">Severity</div>
                <LegendDot className="bg-red-600" label="Critical" />
                <LegendDot className="bg-orange-500" label="High" />
                <LegendDot className="bg-amber-500" label="Moderate" />
                <LegendDot className="bg-emerald-600" label="Low" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <TriageList
              incidents={incidents}
              query={query}
              category={category}
              selectedId={selectedId}
              onQuery={setQuery}
              onCategory={setCategory}
              onSelect={(id) => selectIncident(id, true)}
            />
          </div>
        </section>
        <AnalyticsPanel incidents={incidents} />
        <section className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
          <button type="button" onClick={() => setJsonOpen((open) => !open)} className="flex w-full items-center justify-between text-left">
            <span>
              <span className="font-mono text-xs text-brand-500">Schema inspector</span>
              <span className="ml-2 text-sm font-bold text-slate-200">Selected incident</span>
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
              {jsonOpen ? "Collapse JSON" : "Expand JSON"}
            </span>
          </button>
          {jsonOpen && (
            <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-400">
              {selected ? JSON.stringify(selected, null, 2) : "Select an incident."}
            </pre>
          )}
        </section>
      </main>
      <footer className="mt-12 border-t border-slate-800 bg-slate-900 py-6 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-bold text-slate-200">CivicPulse Mesh · TypeScript and Bun</div>
            <p className="mt-0.5 text-[11px] text-slate-500">Map tiles © OpenStreetMap contributors © CARTO</p>
          </div>
          <p className="font-mono text-[11px] text-slate-500">React · Leaflet · Tailwind · local draft simulator</p>
        </div>
      </footer>
      {notice && (
        <div className="fixed right-4 bottom-4 z-[60] max-w-sm rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-slate-100 shadow-lg">
          {notice}
        </div>
      )}
      <IntakeModal
        open={intakeOpen}
        existingCount={incidents.length}
        onClose={() => setIntakeOpen(false)}
        onCreate={(incident, message) => {
          setIncidents((current) => [incident, ...current])
          selectIncident(incident.incident_id, incident.latitude !== null && incident.longitude !== null)
          setNotice(message)
          window.setTimeout(() => setNotice(null), 4000)
        }}
      />
    </div>
  )
}

function Stat({ label, value, detail, tone = "text-slate-100" }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/70 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-bold ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{detail}</div>
    </div>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} />
      <span>{label}</span>
    </div>
  )
}
