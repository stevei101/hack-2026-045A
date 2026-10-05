import { useMemo, useState, type FormEvent } from "react";

type Coords = { lat: number; lng: number } | null;

type Props = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: { rawText: string; coords: Coords; image: File | null }) => Promise<void>;
};

const ACCEPT = "image/jpeg,image/png,image/webp";

export function SubmissionModal({ open, busy, error, onClose, onSubmit }: Props) {
  const [rawText, setRawText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [coords, setCoords] = useState<Coords>(null);
  const [locationNote, setLocationNote] = useState("Location is optional. Denial still files the report.");

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);

  if (!open) return null;

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationNote("This browser does not expose geolocation. File without coordinates.");
      setCoords(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationNote("Device GPS attached. Street names are not geocoded.");
      },
      () => {
        setCoords(null);
        setLocationNote("Location permission denied. The report will stay in the unmapped queue.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ rawText, coords, image });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-[#243049] bg-[#101827] p-5 shadow-2xl"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal-300">Citizen intake</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Report a hazard</h2>
        <p className="mt-2 text-sm text-[#8b9bb3]">
          Describe the scene. Photos stay on-device until you submit. The API never fetches an image URL.
        </p>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block text-[#c5d0e0]">What happened?</span>
          <textarea
            required
            minLength={5}
            maxLength={2000}
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            rows={5}
            placeholder="Downed oak across RM 620, live wires on the shoulder…"
            className="w-full resize-y rounded-xl border border-[#243049] bg-[#070b14] px-3 py-2 text-sm text-white outline-none focus:border-teal-300/70"
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block text-[#c5d0e0]">Photo (JPEG, PNG, or WebP)</span>
          <input
            type="file"
            accept={ACCEPT}
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[#8b9bb3] file:mr-3 file:rounded-lg file:border-0 file:bg-[#162033] file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
        </label>
        {preview ? (
          <img src={preview} alt="Selected hazard photo" className="mt-3 h-36 w-full rounded-xl object-cover" />
        ) : (
          <p className="mt-2 text-xs text-[#8b9bb3]">No photo selected. Text-only reports are accepted.</p>
        )}

        <div className="mt-4 rounded-xl border border-[#243049] bg-[#070b14] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#c5d0e0]">
              {coords
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : "No coordinates attached"}
            </p>
            <button
              type="button"
              onClick={useMyLocation}
              className="rounded-lg bg-[#162033] px-3 py-1.5 text-sm text-teal-200 hover:bg-[#1c2a44]"
            >
              Use my location
            </button>
          </div>
          <p className="mt-2 text-xs text-[#8b9bb3]">{locationNote}</p>
        </div>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm text-[#c5d0e0] hover:bg-[#162033]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || rawText.trim().length < 5}
            className="rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-[#07201c] disabled:opacity-50"
          >
            {busy ? "Filing…" : "File report"}
          </button>
        </div>
      </form>
    </div>
  );
}
