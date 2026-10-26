"use client";

import { FlaskConical } from "lucide-react";
import { fmt } from "@/lib/format";
import { periodBounds, rangeDays } from "@/lib/data";
import { useDashboard } from "./dashboard-context";

export function PageHeader({ title, description }: { title: string; description: string }) {
  const { client, range } = useDashboard();
  const { start, end } = periodBounds(range);
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-indigo-700">
          {client.name} <span className="text-slate-500" aria-hidden="true">·</span>{" "}
          <span className="text-slate-600">{client.industry}, {client.location}</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:shrink-0 sm:items-end">
        <p className="text-sm text-slate-700 tabular-nums" data-testid="period">
          {fmt.longDate(start)} – {fmt.longDate(end)}
          <span className="text-slate-600"> · vs previous {rangeDays(range)} days</span>
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 ring-inset">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          Sample data for demonstration
        </span>
      </div>
    </div>
  );
}

export function useComparisonLabel(): string {
  const { range } = useDashboard();
  return `vs prev. ${rangeDays(range)} days`;
}
