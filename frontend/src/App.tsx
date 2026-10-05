import { useEffect, useMemo, useState } from "react";
import { listIncidents, reportHazard } from "./api";
import { IncidentMap } from "./components/IncidentMap";
import { SubmissionModal } from "./components/SubmissionModal";
import { TriageDrawer } from "./components/TriageDrawer";
import { isMapped, type IncidentCard } from "./types";

export default function App() {
  const [incidents, setIncidents] = useState<IncidentCard[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  const mappedCount = useMemo(() => incidents.filter(isMapped).length, [incidents]);

  function selectIncident(incident: IncidentCard) {
    setSelectedId(incident.incident_id);
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
      setSelectedId(card.incident_id);
      setModalOpen(false);
      setToast(
        isMapped(card)
          ? `${card.incident_id} filed and pinned.`
          : `${card.incident_id} filed without GPS — sitting in unmapped triage.`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "The report could not be filed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-[#070b14] text-[#d7e0ef]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#243049] bg-[#0b1220] px-4 py-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal-300">
            CivicPulse Mesh · hack.oxidizedgraph.dev
          </p>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Interactive civic hazard intelligence</h1>
          <p className="text-sm text-[#8b9bb3]">
            Travis and Williamson County intake. Heuristic classification. No invented coordinates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-[#243049] px-3 py-1 font-mono text-[11px] text-[#8b9bb3] sm:inline">
            {status === "ready" ? `${mappedCount} pins live` : status === "loading" ? "Syncing feed" : "Feed down"}
          </span>
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setModalOpen(true);
            }}
            className="rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-[#07201c]"
          >
            Report hazard
          </button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="relative min-h-[52vh] lg:min-h-0">
          {status === "loading" ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#070b14]/70 text-sm text-[#c5d0e0]">
              Loading Travis and Williamson incident cache…
            </div>
          ) : null}
          {status === "error" ? (
            <div className="absolute inset-x-4 top-4 z-10 rounded-xl border border-red-400/40 bg-[#2a1214] p-4 text-sm text-red-100">
              <p>{error}</p>
              <button type="button" onClick={() => void refresh()} className="mt-2 underline">
                Retry feed
              </button>
            </div>
          ) : null}
          <IncidentMap incidents={incidents} selectedId={selectedId} onSelect={selectIncident} />
        </section>
        <div className="min-h-[40vh] lg:min-h-0">
          <TriageDrawer incidents={incidents} selectedId={selectedId} onSelect={selectIncident} />
        </div>
      </main>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-teal-300/40 bg-[#10241f] px-4 py-2 text-sm text-teal-100 shadow-lg">
          {toast}
        </div>
      ) : null}

      <SubmissionModal
        open={modalOpen}
        busy={submitting}
        error={submitError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
