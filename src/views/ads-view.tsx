"use client";

import { BadgeDollarSign, Gauge, Target, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { ChartFrame } from "@/components/chart-frame";
import { SpendConversionsChart } from "@/components/charts/ads-chart";
import { useDashboard } from "@/components/dashboard-context";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, useComparisonLabel } from "@/components/page-header";
import { Badge } from "@/components/status-badge";
import { getAds, type CampaignRow } from "@/lib/data";
import { fmt } from "@/lib/format";
import { trendPhrase } from "@/lib/summary";

const campaignColumns: Column<CampaignRow>[] = [
  {
    key: "name",
    header: "Campaign",
    sortValue: (r) => r.name,
    cell: (r) => (
      <span className="flex flex-col gap-1">
        <span className="font-medium text-slate-900">{r.name}</span>
        <span className="flex items-center gap-2 text-xs text-slate-600">
          <Badge>{r.platform}</Badge>
          {r.objective}
        </span>
      </span>
    ),
  },
  { key: "spend", header: "Spend", align: "right", sortValue: (r) => r.spend, cell: (r) => fmt.usd(r.spend), defaultDesc: true },
  { key: "impressions", header: "Impr.", align: "right", sortValue: (r) => r.impressions, cell: (r) => fmt.int(r.impressions), defaultDesc: true },
  { key: "clicks", header: "Clicks", align: "right", sortValue: (r) => r.clicks, cell: (r) => fmt.int(r.clicks), defaultDesc: true },
  { key: "ctr", header: "CTR", align: "right", sortValue: (r) => r.ctr, cell: (r) => fmt.pct(r.ctr), defaultDesc: true },
  { key: "cpc", header: "CPC", align: "right", sortValue: (r) => r.cpc, cell: (r) => fmt.usd2(r.cpc) },
  { key: "conversions", header: "Conv.", align: "right", sortValue: (r) => r.conversions, cell: (r) => fmt.int(r.conversions), defaultDesc: true },
  { key: "cpa", header: "CPA", align: "right", sortValue: (r) => r.cpa, cell: (r) => fmt.usd2(r.cpa) },
  {
    key: "roas",
    header: "ROAS",
    align: "right",
    sortValue: (r) => r.roas,
    cell: (r) => <span className="font-semibold text-slate-900">{fmt.roas(r.roas)}</span>,
    defaultDesc: true,
  },
];

const PLATFORM_FILTERS = ["All", "Google Ads", "Meta Ads"] as const;
type PlatformFilter = (typeof PLATFORM_FILTERS)[number];

function PacingBar({ label, spent, budget, testId }: { label: string; spent: number; budget: number; testId?: string }) {
  const ratio = budget ? spent / budget : 0;
  const status = ratio > 1.05 ? "Over-pacing" : ratio < 0.9 ? "Under-pacing" : "On pace";
  const tone = status === "On pace" ? "bg-indigo-600" : status === "Over-pacing" ? "bg-rose-600" : "bg-amber-500";
  const statusTone =
    status === "On pace" ? "text-emerald-800 bg-emerald-50 ring-emerald-200" : status === "Over-pacing" ? "text-rose-800 bg-rose-50 ring-rose-200" : "text-amber-900 bg-amber-50 ring-amber-200";
  return (
    <div data-testid={testId} data-pacing data-spent={Math.round(spent)} data-budget={Math.round(budget)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-600 tabular-nums">
          <span className="font-semibold text-slate-900">{fmt.usd(spent)}</span> of {fmt.usd(budget)}
        </p>
      </div>
      <div
        className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 ring-inset"
        role="progressbar"
        aria-label={`${label} budget used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuetext={`${fmt.pct0(ratio)} of budget used, ${status.toLowerCase()}`}
      >
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-slate-600 tabular-nums">{fmt.pct0(ratio)} used</span>
        <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${statusTone}`}>{status}</span>
      </div>
    </div>
  );
}

export function AdsView() {
  const { clientId, range } = useDashboard();
  const data = useMemo(() => getAds(clientId, range), [clientId, range]);
  const vs = useComparisonLabel();
  const [platform, setPlatform] = useState<PlatformFilter>("All");

  const rows = useMemo(
    () => (platform === "All" ? data.campaigns : data.campaigns.filter((c) => c.platform === platform)),
    [data.campaigns, platform],
  );
  const totals = useMemo(() => {
    const spend = rows.reduce((t, r) => t + r.spend, 0);
    const impressions = rows.reduce((t, r) => t + r.impressions, 0);
    const clicks = rows.reduce((t, r) => t + r.clicks, 0);
    const conversions = rows.reduce((t, r) => t + r.conversions, 0);
    const value = rows.reduce((t, r) => t + r.roas * r.spend, 0);
    return { spend, impressions, clicks, conversions, ctr: clicks / impressions, cpc: spend / clicks, cpa: spend / conversions, roas: value / spend };
  }, [rows]);

  const best = [...data.campaigns].sort((a, b) => b.roas - a.roas)[0]!;

  return (
    <>
      <PageHeader title="Paid ads" description="Google Ads and Meta Ads campaigns, spend efficiency and budget pacing." />

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <KpiCard
            testId="ads-spend"
            label="Spend"
            value={fmt.usd(data.spend.value)}
            icon={<Wallet className="size-4" />}
            delta={{ current: data.spend.value, previous: data.spend.previous, comparisonLabel: vs }}
            spark={data.spend.spark}
          />
          <KpiCard
            testId="ads-conversions"
            label="Conversions"
            value={fmt.int(data.conversions.value)}
            icon={<Target className="size-4" />}
            delta={{ current: data.conversions.value, previous: data.conversions.previous, comparisonLabel: vs }}
            spark={data.conversions.spark}
          />
          <KpiCard
            testId="ads-cpa"
            label="Cost per acquisition"
            value={fmt.usd2(data.cpa.value)}
            icon={<BadgeDollarSign className="size-4" />}
            delta={{ current: data.cpa.value, previous: data.cpa.previous, invert: true, comparisonLabel: vs }}
            spark={data.cpa.spark}
          />
          <KpiCard
            testId="ads-roas"
            label="ROAS"
            value={fmt.roas(data.roas.value)}
            icon={<Gauge className="size-4" />}
            delta={{ current: data.roas.value, previous: data.roas.previous, comparisonLabel: vs }}
            spark={data.roas.spark}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card headingLevel={2} id="ads-trend" className="lg:col-span-2" title="Spend vs conversions" description={data.days > 30 ? "Weekly totals, all campaigns" : "Daily totals, all campaigns"}>
            <ChartFrame
              label="Bar and line chart of ad spend and conversions over time"
              summary={`${fmt.usd(data.spend.value)} spent (${trendPhrase(data.spend.value, data.spend.previous)}) for ${fmt.int(data.conversions.value)} conversions (${trendPhrase(data.conversions.value, data.conversions.previous)}).`}
              legend={[
                { label: "Spend", color: "#a5b4fc" },
                { label: "Conversions", color: "#0f766e" },
              ]}
              height={260}
            >
              <SpendConversionsChart data={data.trend} days={data.days} />
            </ChartFrame>
          </Card>
          <Card headingLevel={2} id="pacing" title="Budget pacing" description={`Planned budget for the ${data.days}-day period`}>
            <div className="space-y-6">
              <PacingBar label="All platforms" spent={data.pacing.spent} budget={data.pacing.budget} testId="pacing-total" />
              {data.pacing.platforms.map((p) => (
                <PacingBar key={p.platform} label={p.platform} spent={p.spent} budget={p.budget} />
              ))}
              <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-200 ring-inset">
                Best return: <span className="font-medium text-slate-900">{best.name}</span> at{" "}
                <span className="font-medium text-slate-900 tabular-nums">{fmt.roas(best.roas)}</span> ROAS.
              </p>
            </div>
          </Card>
        </div>

        <Card headingLevel={2}
          id="campaigns"
          title="Campaigns"
          description={`${rows.length} campaigns · sorted by spend by default`}
          action={
            <fieldset className="min-w-0">
              <legend className="sr-only">Filter campaigns by platform</legend>
              <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5">
                {PLATFORM_FILTERS.map((option) => (
                  <label
                    key={option}
                    className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 has-[:checked]:bg-white has-[:checked]:text-slate-900 has-[:checked]:shadow-sm has-[:checked]:ring-1 has-[:checked]:ring-slate-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-indigo-600"
                  >
                    <input
                      type="radio"
                      name="platform"
                      value={option}
                      checked={platform === option}
                      onChange={() => setPlatform(option)}
                      className="sr-only"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          }
          bodyClassName="!pb-0"
        >
          <DataTable
            rows={rows}
            columns={campaignColumns}
            getRowId={(r) => r.id}
            caption="Campaign performance"
            initialSort={{ key: "spend", dir: "desc" }}
            minWidth={880}
            footer={
              <tfoot>
                <tr className="bg-slate-50/80 font-semibold text-slate-900 tabular-nums">
                  <th scope="row" className="border-t border-slate-200 py-3 pr-3 pl-5 text-left text-sm sm:pl-6">
                    Total
                  </th>
                  <td className="border-t border-slate-200 px-3 py-3 text-right">{fmt.usd(totals.spend)}</td>
                  <td className="border-t border-slate-200 px-3 py-3 text-right">{fmt.int(totals.impressions)}</td>
                  <td className="border-t border-slate-200 px-3 py-3 text-right">{fmt.int(totals.clicks)}</td>
                  <td className="border-t border-slate-200 px-3 py-3 text-right">{fmt.pct(totals.ctr)}</td>
                  <td className="border-t border-slate-200 px-3 py-3 text-right">{fmt.usd2(totals.cpc)}</td>
                  <td className="border-t border-slate-200 px-3 py-3 text-right">{fmt.int(totals.conversions)}</td>
                  <td className="border-t border-slate-200 px-3 py-3 text-right">{fmt.usd2(totals.cpa)}</td>
                  <td className="border-t border-slate-200 py-3 pr-5 pl-3 text-right sm:pr-6">{fmt.roas(totals.roas)}</td>
                </tr>
              </tfoot>
            }
          />
        </Card>
      </div>
    </>
  );
}
