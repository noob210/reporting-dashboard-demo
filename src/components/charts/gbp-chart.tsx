"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "@/lib/format";
import { ChartTooltip, axisProps, gridProps, periodLabel } from "./chart-theme";

export const GBP_SERIES = [
  { key: "views", label: "Profile views", color: "#4f46e5" },
  { key: "calls", label: "Calls", color: "#0ea5e9" },
  { key: "directions", label: "Direction requests", color: "#14b8a6" },
] as const;

export function GbpChart({ data, days }: { data: Array<{ date: string; views: number; calls: number; directions: number }>; days: number }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart accessibilityLayer={false} data={data} margin={{ top: 4, right: 0, bottom: 0, left: -8 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...axisProps} tickFormatter={(v) => fmt.date(String(v))} minTickGap={24} />
        <YAxis yAxisId="views" {...axisProps} tickFormatter={(v) => fmt.compact(Number(v))} width={44} />
        <YAxis yAxisId="actions" orientation="right" {...axisProps} tickFormatter={(v) => fmt.compact(Number(v))} width={36} />
        <Tooltip content={<ChartTooltip formatLabel={periodLabel(days)} />} />
        {GBP_SERIES.map((s) => (
          <Line
            key={s.key}
            yAxisId={s.key === "views" ? "views" : "actions"}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
