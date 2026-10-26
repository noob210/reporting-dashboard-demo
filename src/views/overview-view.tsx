"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Eye,
  Gauge,
  Globe,
  Inbox,
  MapPin,
  Megaphone,
  MousePointerClick,
  Phone,
  Search,
  Star,
  Store,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Card, SectionHeading } from "@/components/card";
import { ChartFrame } from "@/components/chart-frame";
import { GbpChart, GBP_SERIES } from "@/components/charts/gbp-chart";
import { LeadsSourceChart } from "@/components/charts/leads-source-chart";
import { TrafficChart } from "@/components/charts/traffic-chart";
import { useDashboard } from "@/components/dashboard-context";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, useComparisonLabel } from "@/components/page-header";
import { Badge } from "@/components/status-badge";
import { getOverview, type LeadRow } from "@/lib/data";
import { fmt } from "@/lib/format";
import { trendPhrase } from "@/lib/summary";

const leadColumns: Column<LeadRow>[] = [
  {
    key: "receivedAt",
    header: "Received",
    sortValue: (r) => r.receivedAt,
    cell: (r) => <span className="text-slate-600">{fmt.dateTime(r.receivedAt)}</span>,
    defaultDesc: true,
  },
  { key: "name", header: "Lead", sortValue: (r) => r.name, cell: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
  { key: "source", header: "Source", sortValue: (r) => r.source, cell: (r) => r.source },
  { key: "service", header: "Enquiry", sortValue: (r) => r.service, cell: (r) => r.service },
  { key: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <Badge>{r.status}</Badge> },
  {
    key: "value",
    header: "Est. value",
    align: "right",
    sortValue: (r) => r.value,
    cell: (r) => fmt.usd(r.value),
    defaultDesc: true,
  },
];

export function OverviewView() {
  const { clientId, range } = useDashboard();
  const data = useMemo(() => getOverview(clientId, range), [clientId, range]);
  const vs = useComparisonLabel();
  const { traffic, seo, gbp, ads, leads, days } = data;

  const topChannel = [...traffic.channelTotals].sort((a, b) => b.value - a.value)[0]!;
  const channelSum = traffic.channelTotals.reduce((t, c) => t + c.value, 0);
  const topSource = leads.bySource[0]!;

  return (
    <>
      <PageHeader
        title="Marketing overview"
        description="Website traffic, search visibility, Google Business Profile, paid media and leads in one view."
      />

      <div className="space-y-10">
        <section aria-labelledby="traffic-heading">
          <SectionHeading
            id="traffic-heading"
            title="Website traffic & SEO"
            description="Visits to the website and organic search performance."
            icon={<Globe className="size-4" />}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <KpiCard
              testId="sessions"
              label="Sessions"
              value={fmt.int(traffic.sessions.value)}
              icon={<TrendingUp className="size-4" />}
              delta={{ current: traffic.sessions.value, previous: traffic.sessions.previous, comparisonLabel: vs }}
              spark={traffic.sessions.spark}
            />
            <KpiCard
              testId="users"
              label="Users"
              value={fmt.int(traffic.users.value)}
              icon={<Users className="size-4" />}
              delta={{ current: traffic.users.value, previous: traffic.users.previous, comparisonLabel: vs }}
              spark={traffic.users.spark}
            />
            <KpiCard
              testId="organic-clicks"
              label="Organic clicks"
              value={fmt.int(seo.clicks.value)}
              icon={<MousePointerClick className="size-4" />}
              delta={{ current: seo.clicks.value, previous: seo.clicks.previous, comparisonLabel: vs }}
              spark={seo.clicks.spark}
            />
            <KpiCard
              testId="avg-position"
              label="Avg. position"
              value={fmt.dec1(seo.position.value)}
              icon={<Search className="size-4" />}
              delta={{
                current: seo.position.value,
                previous: seo.position.previous,
                invert: true,
                mode: "absolute",
                formatAbsolute: (n) => fmt.dec1(n),
                comparisonLabel: vs,
              }}
              spark={seo.position.spark.map((v) => -v)}
            />
          </div>

          <Card
            id="traffic-chart"
            className="mt-4"
            title="Traffic over time by channel"
            description={days > 30 ? "Weekly sessions, stacked by acquisition channel" : "Daily sessions, stacked by acquisition channel"}
            action={
              <Link href="/seo/" className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-indigo-700 hover:text-indigo-900">
                SEO report <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            }
          >
            <ChartFrame
              label="Stacked area chart of sessions by channel over the selected period"
              summary={`${fmt.int(traffic.sessions.value)} sessions, ${trendPhrase(traffic.sessions.value, traffic.sessions.previous)}. ${topChannel.label} was the largest channel with ${fmt.int(topChannel.value)} sessions (${fmt.pct0(topChannel.value / channelSum)}).`}
              legend={traffic.channelTotals.map((c) => ({ label: c.label, color: c.color, value: fmt.compact(c.value) }))}
              height={280}
            >
              <TrafficChart data={traffic.byChannel} days={days} />
            </ChartFrame>
          </Card>
        </section>

        <section aria-labelledby="gbp-heading">
          <SectionHeading
            id="gbp-heading"
            title="Google Business Profile"
            description="How local customers find and act on the business listing."
            icon={<Store className="size-4" />}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <KpiCard
              testId="gbp-views"
              label="Profile views"
              value={fmt.int(gbp.views.value)}
              icon={<Eye className="size-4" />}
              delta={{ current: gbp.views.value, previous: gbp.views.previous, comparisonLabel: vs }}
              spark={gbp.views.spark}
            />
            <KpiCard
              testId="gbp-calls"
              label="Calls"
              value={fmt.int(gbp.calls.value)}
              icon={<Phone className="size-4" />}
              delta={{ current: gbp.calls.value, previous: gbp.calls.previous, comparisonLabel: vs }}
              spark={gbp.calls.spark}
            />
            <KpiCard
              testId="gbp-directions"
              label="Direction requests"
              value={fmt.int(gbp.directions.value)}
              icon={<MapPin className="size-4" />}
              delta={{ current: gbp.directions.value, previous: gbp.directions.previous, comparisonLabel: vs }}
              spark={gbp.directions.spark}
            />
            <KpiCard
              testId="gbp-rating"
              label="Rating & reviews"
              value={`${fmt.dec1(gbp.rating.value)} / 5`}
              icon={<Star className="size-4" />}
              delta={{
                current: gbp.rating.value,
                previous: gbp.rating.previous,
                mode: "absolute",
                formatAbsolute: (n) => fmt.dec2(n),
                comparisonLabel: vs,
              }}
              footnote={
                <>
                  <span className="font-medium text-slate-900 tabular-nums">{fmt.int(gbp.reviews.total)}</span> reviews ·{" "}
                  <span className="font-medium text-slate-900 tabular-nums">{fmt.int(gbp.reviews.newInPeriod)}</span> new this period
                </>
              }
            />
          </div>
          <Card
            id="gbp-chart"
            className="mt-4"
            title="Profile activity trend"
            description={`Views (left axis), calls and direction requests (right axis) · ${fmt.int(gbp.websiteClicks.value)} website clicks from the profile`}
          >
            <ChartFrame
              label="Line chart of Google Business Profile views, calls and direction requests"
              summary={`Profile views ${trendPhrase(gbp.views.value, gbp.views.previous)}; calls ${trendPhrase(gbp.calls.value, gbp.calls.previous)}; direction requests ${trendPhrase(gbp.directions.value, gbp.directions.previous)}.`}
              legend={GBP_SERIES.map((s) => ({ label: s.label, color: s.color }))}
              height={200}
            >
              <GbpChart data={gbp.trend} days={days} />
            </ChartFrame>
          </Card>
        </section>

        <section aria-labelledby="ads-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <SectionHeading
              id="ads-heading"
              title="Paid ads"
              description="Google Ads and Meta Ads combined."
              icon={<Megaphone className="size-4" />}
            />
            <Link href="/ads/" className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-indigo-700 hover:text-indigo-900">
              Campaign report <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <KpiCard
              testId="ad-spend"
              label="Ad spend"
              value={fmt.usd(ads.spend.value)}
              icon={<BadgeDollarSign className="size-4" />}
              delta={{ current: ads.spend.value, previous: ads.spend.previous, comparisonLabel: vs }}
              spark={ads.spend.spark}
            />
            <KpiCard
              testId="roas"
              label="ROAS"
              value={fmt.roas(ads.roas.value)}
              icon={<Gauge className="size-4" />}
              delta={{ current: ads.roas.value, previous: ads.roas.previous, comparisonLabel: vs }}
              spark={ads.roas.spark}
            />
            <KpiCard
              testId="conversions"
              className="col-span-2 lg:col-span-1"
              label="Conversions"
              value={fmt.int(ads.conversions.value)}
              icon={<Target className="size-4" />}
              delta={{ current: ads.conversions.value, previous: ads.conversions.previous, comparisonLabel: vs }}
              spark={ads.conversions.spark}
            />
          </div>
        </section>

        <section aria-labelledby="leads-heading">
          <SectionHeading
            id="leads-heading"
            title="Leads"
            description="Form fills, calls and bookings attributed to marketing."
            icon={<Inbox className="size-4" />}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
              <KpiCard
                testId="leads"
                label="Leads"
                value={fmt.int(leads.count.value)}
                icon={<UserRound className="size-4" />}
                delta={{ current: leads.count.value, previous: leads.count.previous, comparisonLabel: vs }}
                spark={leads.count.spark}
              />
              <KpiCard
                testId="cpl"
                label="Cost per lead"
                value={fmt.usd2(leads.costPerLead.value)}
                icon={<BadgeDollarSign className="size-4" />}
                delta={{ current: leads.costPerLead.value, previous: leads.costPerLead.previous, invert: true, comparisonLabel: vs }}
                spark={leads.costPerLead.spark}
              />
            </div>
            <Card id="leads-source" className="lg:col-span-2" title="Leads by source" description="Share of leads by first-touch channel">
              <ChartFrame
                label="Horizontal bar chart of leads by source"
                summary={`${fmt.int(leads.count.value)} leads, ${trendPhrase(leads.count.value, leads.count.previous)}. ${topSource.label} delivered the most (${fmt.int(topSource.value)}, ${fmt.pct0(topSource.value / Math.max(1, leads.count.value))}).`}
                height={230}
              >
                <LeadsSourceChart data={leads.bySource} />
              </ChartFrame>
            </Card>
          </div>

          <Card
            id="recent-leads"
            className="mt-4"
            title="Recent leads"
            description={`Showing the ${leads.recent.rows.length} most recent of ${fmt.int(leads.recent.total)} leads in this period. Names are fictional.`}
            bodyClassName="!pb-0"
          >
            <DataTable
              rows={leads.recent.rows}
              columns={leadColumns}
              getRowId={(r) => r.id}
              caption="Recent leads"
              initialSort={{ key: "receivedAt", dir: "desc" }}
              minWidth={720}
            />
          </Card>
        </section>
      </div>
    </>
  );
}
