"use client";

import type { ReactNode } from "react";
import { useHydrated } from "./use-hydrated";

/**
 * Wraps a chart with an accessible name and a plain-text summary. The chart itself
 * renders after hydration so the static HTML never depends on measured sizes.
 */
export function ChartFrame({
  label,
  summary,
  height = 260,
  legend,
  children,
}: {
  label: string;
  summary: string;
  height?: number;
  legend?: Array<{ label: string; color: string; value?: string }>;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  return (
    <figure className="m-0 min-w-0" aria-label={label}>
      {legend && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600" aria-label="Legend">
          {legend.map((item) => (
            <li key={item.label} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
              <span>{item.label}</span>
              {item.value && <span className="font-medium text-slate-900 tabular-nums">{item.value}</span>}
            </li>
          ))}
        </ul>
      )}
      <div className="w-full min-w-0" style={{ height }}>
        {hydrated ? children : <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />}
      </div>
      <figcaption className="mt-3 text-xs leading-5 text-slate-600">{summary}</figcaption>
    </figure>
  );
}
