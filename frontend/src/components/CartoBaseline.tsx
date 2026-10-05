import { CARTO_MAP_URL, cartoIframeSrc } from "../carto";

export function CartoBaseline() {
  const src = CARTO_MAP_URL ? cartoIframeSrc(CARTO_MAP_URL) : null;

  if (!src) {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-3 bg-[#0b1220] px-6 text-sm text-[#c5d0e0]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300">
          City operations baseline
        </p>
        <h2 className="text-lg font-semibold text-white">CARTO Builder map is not locked yet</h2>
        <p className="max-w-xl text-[#8b9bb3]">
          Publish a Public Austin 311 map at{" "}
          <span className="font-mono text-cyan-100">clausa.app.carto.com</span> with a category
          widget on <span className="font-mono">sr_type_desc</span> and an H3 hexbin. Then set{" "}
          <span className="font-mono text-cyan-100">VITE_CARTO_MAP_URL</span> to that share link.
        </p>
        <p className="max-w-xl text-[#8b9bb3]">
          The iframe <span className="font-mono">src</span> stays fixed so pans and new reports do
          not reload tiles. Export the 1,000-row subset with{" "}
          <span className="font-mono">scripts/fetch_austin_311.py</span> — the CSV stays out of git.
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title="CivicPulse Austin 311 spatial baseline"
      className="h-full w-full border-0"
      loading="lazy"
    />
  );
}
