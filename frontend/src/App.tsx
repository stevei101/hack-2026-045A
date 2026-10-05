import { useEffect, useMemo, useState } from "react";
import { fetchAustin311Context, listIncidents, reportHazard } from "./api";
import { CartoBaseline } from "./components/CartoBaseline";
import { IncidentBanner } from "./components/IncidentBanner";
import { IncidentMap } from "./components/IncidentMap";
import { IntakeForm } from "./components/IntakeForm";
import { TriageDrawer } from "./components/TriageDrawer";
import { CARTO_MAP_URL } from "./carto";
import { AGENCY_LABEL, isMapped, type Austin311Context, type IncidentCard } from "./types";

export default function App() {
  const [incidents, setIncidents] = useState<IncidentCard[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeIncident, setActiveIncident] = useState<IncidentCard | null>(null);
  const [austin311, setAustin311] = useState<Austin311Context | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    setStatus("loading");
    setError(null);
    try {
      const items = await listIncidents();
      setIncidents(items);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Incident feed is unavailable.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!activeIncident) {
      setAustin311(null);
      return;
    }
    let cancelled = false;
    void fetchAustin311Context({
      category: activeIncident.category,
      lat: activeIncident.latitude,
      lng: activeIncident.longitude,
    })
      .then((context) => {
        if (!cancelled) setAustin311(context);
      })
      .catch(() => {
        if (!cancelled) setAustin311(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeIncident]);

  const mappedCount = useMemo(() => incidents.filter(isMapped).length, [incidents]);

  function selectIncident(incident: IncidentCard) {
    setSelectedId(incident.incident_id);
    setActiveIncident(incident);
  }

  async function handleSubmit(payload: {
    rawText: string;
    coords: { lat: number; lng: number } | null;
    image: File | null;
  }) {
    setSubmitting(true);
    setSubmitError(null);
    const form = new FormData();
    form.set("raw_text", payload.rawText);
    if (payload.coords) {
      form.set("lat", String(payload.coords.lat));
      form.set("lng", String(payload.coords.lng));
    }
    if (payload.image) form.set("image", payload.image);
    try {
      const card = await reportHazard(form);
      setIncidents((current) => [card, ...current.filter((item) => item.incident_id !== card.incident_id)]);
      selectIncident(card);
      setToast(
        isMapped(card)
          ? `${card.incident_id} filed and pinned on the live overlay.`
          : `${card.incident_id} filed without GPS — sitting in unmapped triage.`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "The report could not be filed.");
    } finally {
      setSubmitting(false);
    }
  }

  function focusIntake() {
    document.getElementById("citizen-intake")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const field = document.querySelector<HTMLTextAreaElement>("#citizen-intake textarea");
    field?.focus();
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#070b14] text-[#d7e0ef] lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-[#243049] bg-[#0b1220] p-5 max-lg:max-h-[46vh] max-lg:border-b lg:h-full lg:max-w-[460px] lg:min-w-[360px] lg:border-r">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-lg font-bold tracking-tight text-white">CivicPulse Central TX</h1>
          </div>
          <p className="mt-0.5 text-xs text-[#8b9bb3]">
            Decentralized hazard triage · CARTO 311 baseline + FastAPI delta
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-teal-300">
            hack.oxidizedgraph.dev
          </p>
        </div>

        <IntakeForm busy={submitting} error={submitError} onSubmit={handleSubmit} />

        {activeIncident ? (
          <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/50 bg-[#070b14] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-emerald-400">{activeIncident.incident_id}</span>
              <span className="rounded border border-red-800 bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-400">
                {activeIncident.severity}
              </span>
            </div>
            <p className="text-xs font-semibold text-white">{activeIncident.summary}</p>
            <div className="mt-1 grid grid-cols-2 gap-2 border-t border-[#243049] pt-2 text-[11px] text-[#c5d0e0]">
              <div>
                <span className="block text-[#8b9bb3]">Routing agency</span>
                <span className="font-semibold text-emerald-400">{AGENCY_LABEL[activeIncident.target_agency]}</span>
              </div>
              <div>
                <span className="block text-[#8b9bb3]">AI confidence</span>
                <span className="font-mono">{(activeIncident.confidence_score * 100).toFixed(0)}%</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[#8b9bb3]">Attribution model</span>
                <span className="font-mono text-[10px] text-[#8b9bb3]">{activeIncident.model_name}</span>
              </div>
            </div>
          </div>
        ) : null}

        <TriageDrawer
          embedded
          incidents={incidents}
          selectedId={selectedId}
          onSelect={selectIncident}
        />
      </aside>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#243049] bg-[#0b1220] px-4 py-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal-300">
              Interactive civic hazard intelligence
            </p>
            <p className="text-sm text-[#8b9bb3]">
              Travis and Williamson intake. Heuristic classification. No invented coordinates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[#243049] px-3 py-1 font-mono text-[11px] text-[#8b9bb3] sm:inline">
              {status === "ready" ? `${mappedCount} live pins` : status === "loading" ? "Syncing feed" : "Feed down"}
            </span>
            <button
              type="button"
              onClick={focusIntake}
              className="rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-[#07201c]"
            >
              Report hazard
            </button>
          </div>
        </header>

        {status === "error" ? (
          <div className="mx-4 mt-3 rounded-xl border border-red-400/40 bg-[#2a1214] p-4 text-sm text-red-100">
            <p>{error}</p>
            <button type="button" onClick={() => void refresh()} className="mt-2 underline">
              Retry feed
            </button>
          </div>
        ) : null}

        <IncidentBanner incident={activeIncident} context={austin311} />

        <section className="relative min-h-[220px] flex-1">
          <CartoBaseline />
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded border border-[#243049] bg-[#0b1220]/90 px-3 py-1.5 text-xs shadow-lg backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${CARTO_MAP_URL ? "bg-cyan-400" : "bg-amber-400"}`} />
            <span className="font-mono text-[#c5d0e0]">
              {CARTO_MAP_URL
                ? "CARTO Spatial Engine: City of Austin 311 baseline locked"
                : "CARTO Spatial Engine: awaiting public map URL"}
            </span>
          </div>
        </section>

        <section className="relative h-[38%] min-h-[200px] border-t border-[#243049]">
          {status === "loading" ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#070b14]/70 text-sm text-[#c5d0e0]">
              Loading Travis and Williamson incident cache…
            </div>
          ) : null}
          <IncidentMap incidents={incidents} selectedId={selectedId} onSelect={selectIncident} />
          <div className="pointer-events-none absolute top-3 left-4 z-[400] rounded border border-[#243049] bg-[#0b1220]/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-teal-200">
            Live triage overlay · Leaflet delta
          </div>
        </section>
      </main>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-teal-300/40 bg-[#10241f] px-4 py-2 text-sm text-teal-100 shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
