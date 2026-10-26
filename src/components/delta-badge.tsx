import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

export interface DeltaProps {
  current: number;
  previous: number;
  /** When true a decrease is good (average position, cost per lead, CPA). */
  invert?: boolean;
  /** "percent" compares relative change; "absolute" shows the raw difference. */
  mode?: "percent" | "absolute";
  formatAbsolute?: (n: number) => string;
  comparisonLabel?: string;
}

export function DeltaBadge({
  current,
  previous,
  invert = false,
  mode = "percent",
  formatAbsolute = (n) => n.toFixed(1),
  comparisonLabel = "vs previous period",
}: DeltaProps) {
  const diff = current - previous;
  const ratio = previous === 0 ? 0 : diff / Math.abs(previous);
  const magnitude = mode === "percent" ? Math.abs(ratio) : Math.abs(diff);
  const flat = mode === "percent" ? magnitude < 0.0005 : magnitude < 0.05;
  const up = diff > 0;
  const good = flat ? null : invert ? !up : up;

  const text =
    mode === "percent"
      ? `${(magnitude * 100).toFixed(1)}%`
      : formatAbsolute(magnitude);
  const directionWord = flat ? "No change" : up ? "Up" : "Down";
  const Icon = flat ? ArrowRight : up ? ArrowUpRight : ArrowDownRight;

  const tone =
    good === null
      ? "bg-slate-100 text-slate-700 ring-slate-200"
      : good
        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
        : "bg-rose-50 text-rose-800 ring-rose-200";

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums ring-1 ring-inset ${tone}`}>
        <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.5} />
        <span>
          {flat ? "0.0%" : `${up ? "+" : "−"}${text}`}
        </span>
        <span className="sr-only">
          {` (${directionWord}${good === null ? "" : good ? ", improvement" : ", decline"})`}
        </span>
      </span>
      <span className="text-slate-600">{comparisonLabel}</span>
    </span>
  );
}
