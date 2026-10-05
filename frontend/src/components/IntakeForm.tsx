import { useMemo, useState, type FormEvent } from "react";

type Coords = { lat: number; lng: number } | null;

type Props = {
  busy: boolean;
  error: string | null;
  onSubmit: (payload: { rawText: string; coords: Coords; image: File | null }) => Promise<void>;
};

const ACCEPT = "image/jpeg,image/png,image/webp";

export function IntakeForm({ busy, error, onSubmit }: Props) {
  const [rawText, setRawText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [coords, setCoords] = useState<Coords>(null);
  const [locationNote, setLocationNote] = useState("GPS is optional. Denial still files the report.");
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);

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
    <form
      id="citizen-intake"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-[#243049] bg-[#070b14] p-4"
    >
      <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b9bb3]">
        Citizen intake (text / vision)
      </label>
      <textarea
        required
        minLength={5}
        maxLength={2000}
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        rows={3}
        placeholder="Live wires down across McNeil Rd blocking both lanes near Parmer…"
        className="w-full resize-y rounded border border-[#243049] bg-[#0b1220] p-2.5 text-xs text-white outline-none placeholder:text-[#5c6b82] focus:border-emerald-500"
      />
      <label className="block text-[11px] text-[#8b9bb3]">
        Photo optional · JPEG, PNG, or WebP
        <input
          type="file"
          accept={ACCEPT}
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-[11px] text-[#8b9bb3] file:mr-2 file:rounded file:border-0 file:bg-[#162033] file:px-2 file:py-1 file:text-[11px] file:text-white"
        />
      </label>
      {preview ? (
        <img src={preview} alt="Selected hazard photo" className="h-24 w-full rounded object-cover" />
      ) : null}
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#c5d0e0]">
        <span>
          {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "No coordinates attached"}
        </span>
        <button
          type="button"
          onClick={useMyLocation}
          className="rounded bg-[#162033] px-2 py-1 text-[11px] text-teal-200 hover:bg-[#1c2a44]"
        >
          Use my location
        </button>
      </div>
      <p className="text-[11px] text-[#8b9bb3]">{locationNote}</p>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || rawText.trim().length < 5}
        className="rounded bg-emerald-500 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-emerald-600 disabled:opacity-50"
      >
        {busy ? "Extracting geospatial schema…" : "Analyze & dispatch hazard"}
      </button>
    </form>
  );
}
