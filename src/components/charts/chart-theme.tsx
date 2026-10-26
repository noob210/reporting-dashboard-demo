"use client";

import type { ReactNode } from "react";
import { fmt } from "@/lib/format";

export const axisProps = {
  stroke: "#94a3b8",
  tick: { fill: "#475569", fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  stroke: "#e2e8f0",
  strokeDasharray: "3 3",
  vertical: false,
} as const;

interface TooltipEntry {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  dataKey?: string | number | ((obj: unknown) => unknown);
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatLabel = (l) => fmt.date(String(l)),
  formatValue = (v) => fmt.int(v),
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string | number;
  formatLabel?: (label: string | number) => ReactNode;
  formatValue?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label !== undefined && <p className="mb-1.5 font-semibold text-slate-900">{formatLabel(label)}</p>}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.name)} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
              {entry.name}
            </span>
            <span className="font-medium text-slate-900 tabular-nums">
              {formatValue(Number(entry.value ?? 0), String(entry.name))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function periodLabel(days: number) {
  return (value: string | number) => (days > 30 ? `Week of ${fmt.date(String(value))}` : fmt.date(String(value)));
}
