"use client";

import { ArrowDownRight, ArrowUpRight, Eye, Minus, MousePointerClick, Percent, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { ChartFrame } from "@/components/chart-frame";
import { ClicksImpressionsChart, PositionDistributionChart } from "@/components/charts/seo-charts";
import { useDashboard } from "@/components/dashboard-context";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, useComparisonLabel } from "@/components/page-header";
import { getSeo, type KeywordRow, type PageRow } from "@/lib/data";
import { fmt } from "@/lib/format";
import { trendPhrase } from "@/lib/summary";

function PositionChange({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-600">
        <Minus className="size-3.5" aria-hidden="true" />
        <span>0</span>
        <span className="sr-only">no change</span>
      </span>
    );
  }
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${up ? "text-emerald-700" : "text-rose-700"}`}>
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.5} />
      <span>{up ? `+${value}` : `−${Math.abs(value)}`}</span>
      <span className="sr-only">{up ? "positions gained" : "positions lost"}</span>
    </span>
  );
}

function positionTone(position: number) {
  if (position <= 3) return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (position <= 10) return "bg-indigo-50 text-indigo-800 ring-indigo-200";
  if (position <= 20) return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

const keywordColumns: Column<KeywordRow>[] = [
  {
    key: "keyword",
    header: "Keyword",
    sortValue: (r) => r.keyword,
    cell: (r) => <span className="font-medium text-slate-900">{r.keyword}</span>,
  },
  {
    key: "position",
    header: "Position",
    align: "right",
    sortValue: (r) => r.position,
    cell: (r) => (
      <span className={`inline-flex min-w-8 justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${positionTone(r.position)}`}>
        {r.position}
      </span>
    ),
  },
  { key: "change", header: "Change", align: "right", sortValue: (r) => r.change, cell: (r) => <PositionChange value={r.change} />, defaultDesc: true },
  { key: "volume", header: "Volume", align: "right", sortValue: (r) => r.volume, cell: (r) => fmt.int(r.volume), defaultDesc: true },
  { key: "clicks", header: "Clicks", align: "right", sortValue: (r) => r.clicks, cell: (r) => fmt.int(r.clicks), defaultDesc: true },
  {
    key: "url",
    header: "Ranking URL",
    sortValue: (r) => r.url,
    cell: (r) => <span className="font-mono text-xs text-slate-600">{r.url}</span>,
  },
];

const pageColumns: Column<PageRow>[] = [
  {
    key: "path",
    header: "Page",
    sortValue: (r) => r.title,
    cell: (r) => (
      <span className="flex flex-col">
        <span className="font-medium text-slate-900">{r.title}</span>
        <span className="font-mono text-xs text-slate-600">{r.path}</span>
      </span>
    ),
  },
  { key: "clicks", header: "Clicks", align: "right", sortValue: (r) => r.clicks, cell: (r) => fmt.int(r.clicks), defaultDesc: true },
  { key: "impressions", header: "Impressions", align: "right", sortValue: (r) => r.impressions, cell: (r) => fmt.int(r.impressions), defaultDesc: true },
  { key: "ctr", header: "CTR", align: "right", sortValue: (r) => r.ctr, cell: (r) => fmt.pct(r.ctr), defaultDesc: true },
  { key: "position", header: "Avg. position", align: "right", sortValue: (r) => r.position, cell: (r) => fmt.dec1(r.position) },
];

export function SeoView() {
  const { clientId, range } = useDashboard();
  const data = useMemo(() => getSeo(clientId, range), [clientId, range]);
  const vs = useComparisonLabel();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.keywords;
    return data.keywords.filter((k) => k.keyword.toLowerCase().includes(q) || k.url.toLowerCase().includes(q));
  }, [data.keywords, query]);

  const top10 = data.positionDistribution.slice(0, 2).reduce((t, b) => t + b.keywords, 0);
  const gained = data.keywords.filter((k) => k.change > 0).length;
  const lost = data.keywords.filter((k) => k.change < 0).length;

  return (
    <>
      <PageHeader title="SEO performance" description="Organic search visibility from Search Console and rank tracking." />

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <KpiCard
            testId="seo-clicks"
            label="Organic clicks"
            value={fmt.int(data.clicks.value)}
            icon={<MousePointerClick className="size-4" />}
            delta={{ current: data.clicks.value, previous: data.clicks.previous, comparisonLabel: vs }}
            spark={data.clicks.spark}
          />
          <KpiCard
            testId="seo-impressions"
            label="Impressions"
            value={fmt.int(data.impressions.value)}
            icon={<Eye className="size-4" />}
            delta={{ current: data.impressions.value, previous: data.impressions.previous, comparisonLabel: vs }}
            spark={data.impressions.spark}
          />
          <KpiCard
            testId="seo-ctr"
            label="Click-through rate"
            value={fmt.pct(data.ctr.value)}
            icon={<Percent className="size-4" />}
            delta={{ current: data.ctr.value, previous: data.ctr.previous, comparisonLabel: vs }}
            spark={data.ctr.spark}
          />
          <KpiCard
            testId="seo-position"
            label="Avg. position"
            value={fmt.dec1(data.position.value)}
            icon={<Search className="size-4" />}
            delta={{
              current: data.position.value,
              previous: data.position.previous,
              invert: true,
              mode: "absolute",
              formatAbsolute: (n) => fmt.dec1(n),
              comparisonLabel: vs,
            }}
            spark={data.position.spark.map((v) => -v)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card headingLevel={2} id="seo-trend" className="lg:col-span-2" title="Clicks & impressions" description="Organic clicks (left axis) and impressions (right axis)">
            <ChartFrame
              label="Chart of organic clicks and impressions over time"
              summary={`${fmt.int(data.clicks.value)} clicks, ${trendPhrase(data.clicks.value, data.clicks.previous)}, from ${fmt.int(data.impressions.value)} impressions (${trendPhrase(data.impressions.value, data.impressions.previous)}).`}
              legend={[
                { label: "Clicks", color: "#4338ca" },
                { label: "Impressions", color: "#818cf8" },
              ]}
              height={260}
            >
              <ClicksImpressionsChart data={data.trend} days={data.days} />
            </ChartFrame>
          </Card>
          <Card headingLevel={2} id="seo-distribution" title="Position distribution" description={`${fmt.int(data.rankingKeywords)} ranking keywords`}>
            <ChartFrame
              label="Bar chart of ranking keywords grouped by position"
              summary={`${fmt.int(top10)} keywords (${fmt.pct0(top10 / data.rankingKeywords)}) rank on page one, positions 1 to 10.`}
              height={260}
            >
              <PositionDistributionChart data={data.positionDistribution} />
            </ChartFrame>
          </Card>
        </div>

        <Card headingLevel={2}
          id="keywords"
          title="Keyword rankings"
          description={`${data.keywords.length} tracked keywords · ${gained} improved, ${lost} declined`}
          action={
            <div className="relative w-full sm:w-64">
              <label htmlFor="keyword-search" className="sr-only">
                Search keywords
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="keyword-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search keywords or URLs"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pr-8 pl-8 text-sm text-slate-900 placeholder:text-slate-500 hover:border-slate-400 focus-visible:border-indigo-600 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-900"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>
          }
          bodyClassName="!pb-0"
        >
          <p className="sr-only" aria-live="polite">
            {filtered.length} of {data.keywords.length} keywords shown
          </p>
          <DataTable
            rows={filtered}
            columns={keywordColumns}
            getRowId={(r) => r.keyword}
            caption="Keyword rankings"
            initialSort={{ key: "position", dir: "asc" }}
            emptyMessage={`No keywords match “${query}”.`}
            minWidth={760}
          />
        </Card>

        <Card headingLevel={2} id="top-pages" title="Top landing pages" description="Pages earning the most organic clicks" bodyClassName="!pb-0">
          <DataTable
            rows={data.pages}
            columns={pageColumns}
            getRowId={(r) => r.path}
            caption="Top landing pages from organic search"
            initialSort={{ key: "clicks", dir: "desc" }}
            minWidth={640}
          />
        </Card>
      </div>
    </>
  );
}
