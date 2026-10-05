import { SEVERITY_COLOR, type Severity } from "../types";

type Props = {
  severity: Severity;
  compact?: boolean;
};

export function SeverityBadge({ severity, compact = false }: Props) {
  const color = SEVERITY_COLOR[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono uppercase tracking-wide ${
        compact ? "text-[10px]" : "text-[11px]"
      }`}
      style={{
        color,
        borderColor: `${color}66`,
        background: `${color}1a`,
      }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${severity === "CRITICAL" ? "animate-pulse" : ""}`}
        style={{ background: color }}
      />
      {severity}
    </span>
  );
}
