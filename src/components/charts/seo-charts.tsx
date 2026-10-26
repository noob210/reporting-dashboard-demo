"use client";

import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "@/lib/format";
import { ChartTooltip, axisProps, gridProps, periodLabel } from "./chart-theme";

export function ClicksImpressionsChart({ data, days }: { data: Array<{ date: string; clicks: number; impressions: number }>; days: number }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="impressions-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...axisProps} tickFormatter={(v) => fmt.date(String(v))} minTickGap={24} />
        <YAxis yAxisId="clicks" {...axisProps} tickFormatter={(v) => fmt.compact(Number(v))} width={44} />
        <YAxis yAxisId="impressions" orientation="right" {...axisProps} tickFormatter={(v) => fmt.compact(Number(v))} width={44} />
        <Tooltip content={<ChartTooltip formatLabel={periodLabel(days)} />} />
        <Area yAxisId="impressions" type="monotone" dataKey="impressions" name="Impressions" stroke="#818cf8" fill="url(#impressions-fill)" strokeWidth={1.5} isAnimationActive={false} />
        <Line yAxisId="clicks" type="monotone" dataKey="clicks" name="Clicks" stroke="#4338ca" strokeWidth={2.25} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function PositionDistributionChart({ data }: { data: Array<{ label: string; keywords: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} width={44} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          content={<ChartTooltip formatLabel={(l) => `Positions ${l}`} formatValue={(v) => `${fmt.int(v)} keywords`} />}
        />
        <Bar dataKey="keywords" name="Keywords" fill="#4f46e5" radius={[6, 6, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
