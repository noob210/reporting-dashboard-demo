"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHANNELS, type ChannelKey } from "@/lib/clients";
import { fmt } from "@/lib/format";
import { ChartTooltip, axisProps, gridProps, periodLabel } from "./chart-theme";

export function TrafficChart({ data, days }: { data: Array<Record<ChannelKey, number> & { date: string }>; days: number }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart accessibilityLayer={false} data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <defs>
          {CHANNELS.map((c) => (
            <linearGradient key={c.key} id={`traffic-${c.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={c.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...axisProps} tickFormatter={(v) => fmt.date(String(v))} minTickGap={24} />
        <YAxis {...axisProps} tickFormatter={(v) => fmt.compact(Number(v))} width={44} />
        <Tooltip content={<ChartTooltip formatLabel={periodLabel(days)} />} />
        {CHANNELS.map((c) => (
          <Area
            key={c.key}
            type="monotone"
            dataKey={c.key}
            name={c.label}
            stackId="sessions"
            stroke={c.color}
            strokeWidth={1.75}
            fill={`url(#traffic-${c.key})`}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
