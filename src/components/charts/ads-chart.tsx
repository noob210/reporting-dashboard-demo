"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "@/lib/format";
import { ChartTooltip, axisProps, gridProps, periodLabel } from "./chart-theme";

export function SpendConversionsChart({ data, days }: { data: Array<{ date: string; spend: number; conversions: number }>; days: number }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart accessibilityLayer={false} data={data} margin={{ top: 4, right: 0, bottom: 0, left: -4 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...axisProps} tickFormatter={(v) => fmt.date(String(v))} minTickGap={24} />
        <YAxis yAxisId="spend" {...axisProps} tickFormatter={(v) => fmt.usdCompact(Number(v))} width={48} />
        <YAxis yAxisId="conversions" orientation="right" {...axisProps} allowDecimals={false} width={36} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          content={
            <ChartTooltip
              formatLabel={periodLabel(days)}
              formatValue={(v, name) => (name === "Spend" ? fmt.usd(v) : fmt.int(v))}
            />
          }
        />
        <Bar yAxisId="spend" dataKey="spend" name="Spend" fill="#c7d2fe" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Line yAxisId="conversions" type="monotone" dataKey="conversions" name="Conversions" stroke="#0f766e" strokeWidth={2.25} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
