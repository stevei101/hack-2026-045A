import { useState } from "react"
import { PRESETS, incidentFromApi, simulateReport, type Incident } from "../incidents.ts"

type IntakeModalProps = {
  open: boolean
  existingCount: number
  onClose: () => void
  onCreate: (incident: Incident, notice: string) => void
}

export function IntakeModal({ open, existingCount, onClose, onCreate }: IntakeModalProps) {
  const [text, setText] = useState<string>(PRESETS[0].text)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locationNote, setLocationNote] = useState("Location not attached")
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState<Incident | null>(null)

  if (!open) return null

  function loadPreset(id: 1 | 2) {
    const preset = PRESETS.find((item) => item.id === id) ?? PRESETS[0]
    setText(preset.text)
    setPreview(null)
  }

  function chooseFile(next: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(next)
    setPreviewUrl(next ? URL.createObjectURL(next) : null)
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setLocationNote("This browser has no location API. The report will stay unmapped.")
      setLat(null)
      setLng(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setLocationNote("Device location attached")
      },
      () => {
        setLat(null)
        setLng(null)
        setLocationNote("Location denied. The report will stay unmapped.")
      },
    )
  }

  async function run() {
    setRunning(true)
    setPreview(null)
    const form = new FormData()
    form.set("raw_text", text)
    if (lat !== null && lng !== null) {
      form.set("lat", String(lat))
      form.set("lng", String(lng))
    }
    if (file) form.set("image", file)
    try {
      const response = await fetch("/api/v1/hazards/report", { method: "POST", body: form })
      if (!response.ok) throw new Error(String(response.status))
      const created = incidentFromApi(await response.json())
      if (!created) throw new Error("unexpected report shape")
      setPreview(created)
      setRunning(false)
      onCreate(created, "Report filed")
    } catch {
      const created = simulateReport(text, existingCount, lat, lng)
      setPreview(created)
      setRunning(false)
      onCreate(created, "Intake API is down. Saved with the local simulator and no invented pin.")
    }
    window.setTimeout(onClose, 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-500 px-2 py-0.5 font-mono text-xs font-bold text-white">INTAKE</span>
            <h3 className="text-base font-bold text-slate-100">Hazard report</h3>
          </div>
          <button type="button" onClick={onClose} className="px-2 text-lg font-bold text-slate-400 hover:text-white">
            ×
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-300">Sample field report</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => loadPreset(1)} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-left text-[11px] text-slate-300">
                Downed line on Pflugerville Pkwy
              </button>
              <button type="button" onClick={() => loadPreset(2)} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-left text-[11px] text-slate-300">
                Flash flood at FM 685 culvert
              </button>
            </div>
          </div>
          <label className="block space-y-1.5 font-semibold text-slate-300">
            Citizen description
            <textarea
              value={text}
              rows={3}
              onChange={(event) => setText(event.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-normal text-slate-200 focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="block space-y-1.5 font-semibold text-slate-300">
            Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              className="block w-full text-[11px] text-slate-400"
            />
          </label>
          {previewUrl && <img src={previewUrl} alt="Selected hazard" className="max-h-40 rounded-lg border border-slate-800 object-contain" />}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
            <p className="text-[11px] text-slate-400">{locationNote}</p>
            <button type="button" onClick={useLocation} className="rounded border border-slate-700 px-2 py-1 font-mono text-[10px] text-slate-200">
              Use my location
            </button>
          </div>
          {running && (
            <div className="rounded-xl border border-brand-700/60 bg-brand-900/40 p-4 text-center">
              <p className="font-mono text-xs font-semibold text-brand-100">Filing the report</p>
            </div>
          )}
          {preview && (
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px]">
              <div className="flex justify-between border-b border-slate-800 pb-1 font-bold text-emerald-400">
                <span>Extraction complete</span>
                <span>Confidence: {preview.confidence_score.toFixed(2)}</span>
              </div>
              <p className="text-slate-300">
                {preview.category} · {preview.severity} · {preview.target_agency}
              </p>
              <p className="text-slate-500">{preview.model_name}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-850 p-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300">
            Cancel
          </button>
          <button
            type="button"
            disabled={running || text.trim().length < 5}
            onClick={() => void run()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {running ? "Extracting" : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  )
}
