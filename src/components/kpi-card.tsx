import type { ReactNode } from "react";
import { DeltaBadge, type DeltaProps } from "./delta-badge";
import { Sparkline } from "./sparkline";

export function KpiCard({
  label,
  value,
  delta,
  spark,
  icon,
  footnote,
  testId,
  className = "",
}: {
  label: string;
  value: string;
  delta?: DeltaProps;
  spark?: number[];
  icon?: ReactNode;
  footnote?: ReactNode;
  testId?: string;
  className?: string;
}) {
  const good = delta
    ? (delta.invert ? delta.current < delta.previous : delta.current > delta.previous)
    : true;
  return (
    <div
      className={`relative flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.18)] sm:p-5 ${className}`}
      data-kpi={testId}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] leading-5 font-medium text-slate-600">{label}</p>
        {icon && (
          <span className="mt-0.5 hidden text-slate-500 min-[480px]:block" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-[22px] leading-8 font-semibold tracking-tight text-slate-900 tabular-nums sm:text-[28px] sm:leading-9" data-kpi-value>
        {value}
      </p>
      {delta && (
        <div className="mt-2">
          <DeltaBadge {...delta} />
        </div>
      )}
      {footnote && <p className="mt-2 text-xs text-slate-600">{footnote}</p>}
      {spark && (
        <div className="mt-3 -mx-1">
          <Sparkline values={spark} color={good ? "#4f46e5" : "#e11d48"} />
        </div>
      )}
    </div>
  );
}
