"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "@/lib/format";
import { ChartTooltip, axisProps, gridProps } from "./chart-theme";

function CategoryTick({ x, y, payload }: { x?: number | string; y?: number | string; payload?: { value?: string | number } }) {
  return (
    <text x={Number(x)} y={Number(y)} dy={4} textAnchor="end" fill="#334155" fontSize={12}>
      {String(payload?.value ?? "")}
    </text>
  );
}

export function LeadsSourceChart({ data }: { data: Array<{ label: string; short: string; value: number; color: string }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart accessibilityLayer={false} data={data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} barCategoryGap={10}>
        <CartesianGrid {...gridProps} vertical horizontal={false} />
        <XAxis type="number" {...axisProps} tickFormatter={(v) => fmt.int(Number(v))} allowDecimals={false} />
        <YAxis type="category" dataKey="short" {...axisProps} width={112} tick={<CategoryTick />} />
        <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip formatLabel={(l) => String(l)} formatValue={(v) => `${fmt.int(v)} leads`} />} />
        <Bar dataKey="value" name="Leads" radius={[0, 6, 6, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
          <LabelList dataKey="value" position="right" offset={8} fill="#0f172a" fontSize={12} formatter={(v) => fmt.int(Number(v))} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
