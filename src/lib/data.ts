import {
  CHANNELS,
  LEAD_SOURCES,
  getClient,
  type ChannelKey,
  type ClientProfile,
  type LeadSourceKey,
  type Platform,
} from "./clients";
import { seeded, seededBetween } from "./random";

/**
 * All sample data is generated from fixed seeds and a fixed reporting end date,
 * so the server-rendered HTML and the client render always match.
 */
export const REPORT_END = Date.UTC(2026, 9, 25);
const DAY_MS = 86_400_000;
const HISTORY_DAYS = 180;

export type RangeKey = "7d" | "30d" | "90d";

export const RANGES: Array<{ key: RangeKey; label: string; days: number }> = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
];

export const DEFAULT_RANGE: RangeKey = "30d";

export function rangeDays(range: RangeKey): number {
  return RANGES.find((r) => r.key === range)?.days ?? 30;
}

export function rangeLabel(range: RangeKey): string {
  return RANGES.find((r) => r.key === range)?.label ?? "Last 30 days";
}

const DATES: string[] = Array.from({ length: HISTORY_DAYS }, (_, i) =>
  new Date(REPORT_END - (HISTORY_DAYS - 1 - i) * DAY_MS).toISOString(),
);

export function periodBounds(range: RangeKey): { start: string; end: string } {
  const days = rangeDays(range);
  return { start: DATES[HISTORY_DAYS - days]!, end: DATES[HISTORY_DAYS - 1]! };
}

interface SeriesOptions {
  trend?: number;
  noise?: number;
  wave?: number;
  weekendFactor?: number;
}

/** Daily series with gentle growth, a slow wave, weekday seasonality and noise. */
function makeSeries(key: string, base: number, options: SeriesOptions = {}): number[] {
  const { trend = 0.14, noise = 0.12, wave = 0.09, weekendFactor = 1 } = options;
  const rand = seeded("series", key);
  const phase = rand() * Math.PI * 2;
  const period = 38 + rand() * 30;
  return DATES.map((iso, i) => {
    const t = i / (HISTORY_DAYS - 1);
    const day = new Date(iso).getUTCDay();
    const weekday = day === 0 || day === 6 ? weekendFactor : 1;
    const growth = 1 - trend / 2 + trend * t;
    const slow = 1 + wave * Math.sin(phase + (i / period) * Math.PI * 2);
    const jitter = 1 + (rand() - 0.5) * 2 * noise;
    return Math.max(0, base * growth * slow * weekday * jitter);
  });
}

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);
const mean = (values: number[]) => (values.length ? sum(values) / values.length : 0);

function current(values: number[], days: number) {
  return values.slice(HISTORY_DAYS - days);
}

function previous(values: number[], days: number) {
  return values.slice(HISTORY_DAYS - days * 2, HISTORY_DAYS - days);
}

/** Groups a daily window into buckets so 90-day charts stay readable. */
function bucketSize(days: number) {
  return days > 30 ? 7 : 1;
}

export interface MetricValue {
  value: number;
  previous: number;
  spark: number[];
}

function totalMetric(values: number[], days: number): MetricValue {
  const cur = current(values, days);
  return { value: sum(cur), previous: sum(previous(values, days)), spark: sparkline(cur) };
}

function averageMetric(values: number[], days: number): MetricValue {
  const cur = current(values, days);
  return { value: mean(cur), previous: mean(previous(values, days)), spark: sparkline(cur) };
}

function sparkline(values: number[]): number[] {
  if (values.length <= 30) return values;
  const size = Math.ceil(values.length / 30);
  const out: number[] = [];
  for (let i = 0; i < values.length; i += size) out.push(mean(values.slice(i, i + size)));
  return out;
}

interface ClientSeries {
  channels: Record<ChannelKey, number[]>;
  sessions: number[];
  users: number[];
  organicClicks: number[];
  impressions: number[];
  avgPosition: number[];
  gbpViews: number[];
  gbpCalls: number[];
  gbpDirections: number[];
  gbpWebsite: number[];
  gbpReviews: number[];
  leads: Record<LeadSourceKey, number[]>;
  leadsTotal: number[];
  campaigns: Array<{
    id: string;
    spend: number[];
    impressions: number[];
    clicks: number[];
    conversions: number[];
    value: number[];
  }>;
}

const cache = new Map<string, ClientSeries>();

function buildSeries(client: ClientProfile): ClientSeries {
  const id = client.id;
  const wf = client.weekendFactor;

  const channels = Object.fromEntries(
    CHANNELS.map(({ key }) => [
      key,
      makeSeries(`${id}:channel:${key}`, client.sessionsPerDay * client.channelMix[key], {
        weekendFactor: wf,
        trend: key === "organic" ? 0.24 : 0.12,
      }),
    ]),
  ) as Record<ChannelKey, number[]>;

  const sessions = DATES.map((_, i) => sum(CHANNELS.map(({ key }) => channels[key][i]!)));
  const userNoise = makeSeries(`${id}:users`, client.usersPerSession, { trend: 0.02, noise: 0.03, wave: 0.02 });
  const users = sessions.map((s, i) => s * userNoise[i]!);

  const organicClicks = makeSeries(`${id}:clicks`, client.organicClicksPerDay, { weekendFactor: wf, trend: 0.26 });
  const ctr = makeSeries(`${id}:ctr`, client.organicCtr, { trend: 0.06, noise: 0.08, wave: 0.05 });
  const impressions = organicClicks.map((c, i) => c / ctr[i]!);
  const avgPosition = makeSeries(`${id}:position`, client.avgPosition, { trend: -0.22, noise: 0.05, wave: 0.06 });

  const gbpViews = makeSeries(`${id}:gbp:views`, client.gbp.viewsPerDay, { weekendFactor: Math.max(wf, 0.8) });
  const gbpCalls = makeSeries(`${id}:gbp:calls`, client.gbp.callsPerDay, { weekendFactor: wf, noise: 0.25 });
  const gbpDirections = makeSeries(`${id}:gbp:directions`, client.gbp.directionsPerDay, { weekendFactor: wf, noise: 0.25 });
  const gbpWebsite = makeSeries(`${id}:gbp:website`, client.gbp.websiteClicksPerDay, { weekendFactor: wf, noise: 0.2 });
  const gbpReviews = makeSeries(`${id}:gbp:reviews`, client.gbp.reviewsPerDay, { noise: 0.6, wave: 0.2 });

  const leads = Object.fromEntries(
    LEAD_SOURCES.map(({ key }) => [
      key,
      makeSeries(`${id}:leads:${key}`, client.leadsPerDay[key], { weekendFactor: wf, noise: 0.35, wave: 0.14 }),
    ]),
  ) as Record<LeadSourceKey, number[]>;
  const leadsTotal = DATES.map((_, i) => sum(LEAD_SOURCES.map(({ key }) => leads[key][i]!)));

  const campaigns = client.campaigns.map((c) => {
    const spend = makeSeries(`${id}:${c.id}:spend`, c.dailySpend, { noise: 0.1, wave: 0.07, trend: 0.08 });
    const cpc = makeSeries(`${id}:${c.id}:cpc`, c.cpc, { noise: 0.08, trend: 0.04 });
    const ctrS = makeSeries(`${id}:${c.id}:ctr`, c.ctr, { noise: 0.1, trend: 0.06 });
    const cvr = makeSeries(`${id}:${c.id}:cvr`, c.cvr, { noise: 0.3, trend: 0.1, wave: 0.12 });
    const clicks = spend.map((sp, i) => sp / cpc[i]!);
    const impressionsS = clicks.map((cl, i) => cl / ctrS[i]!);
    const conversions = clicks.map((cl, i) => cl * cvr[i]!);
    const valuePerConversion = makeSeries(`${id}:${c.id}:value`, (c.roas * c.cpc) / c.cvr, { noise: 0.18, trend: 0.05 });
    const value = conversions.map((conv, i) => conv * valuePerConversion[i]!);
    return { id: c.id, spend, impressions: impressionsS, clicks, conversions, value };
  });

  return {
    channels,
    sessions,
    users,
    organicClicks,
    impressions,
    avgPosition,
    gbpViews,
    gbpCalls,
    gbpDirections,
    gbpWebsite,
    gbpReviews,
    leads,
    leadsTotal,
    campaigns,
  };
}

function seriesFor(clientId: string): { client: ClientProfile; s: ClientSeries } {
  const client = getClient(clientId);
  let s = cache.get(client.id);
  if (!s) {
    s = buildSeries(client);
    cache.set(client.id, s);
  }
  return { client, s };
}

function addSeries(list: number[][]): number[] {
  return DATES.map((_, i) => sum(list.map((values) => values[i]!)));
}

/** Buckets a set of named daily series into chart rows for the current period. */
function timeline<K extends string>(series: Record<K, number[]>, days: number): Array<Record<K, number> & { date: string }> {
  const size = bucketSize(days);
  const start = HISTORY_DAYS - days;
  const rows: Array<Record<K, number> & { date: string }> = [];
  for (let i = start; i < HISTORY_DAYS; i += size) {
    const row = { date: DATES[i]! } as Record<K, number> & { date: string };
    for (const key of Object.keys(series) as K[]) {
      (row as Record<K, number>)[key] = Math.round(sum(series[key].slice(i, Math.min(i + size, HISTORY_DAYS))));
    }
    rows.push(row);
  }
  return rows;
}

function adsTotals(s: ClientSeries, days: number, filter?: (index: number) => boolean) {
  const pick = s.campaigns.filter((_, index) => (filter ? filter(index) : true));
  const spend = addSeries(pick.map((c) => c.spend));
  const conversions = addSeries(pick.map((c) => c.conversions));
  const value = addSeries(pick.map((c) => c.value));
  const roas = spend.map((sp, i) => (sp ? value[i]! / sp : 0));
  const spendM = totalMetric(spend, days);
  const valueM = totalMetric(value, days);
  return {
    spend: spendM,
    conversions: totalMetric(conversions, days),
    roas: {
      value: spendM.value ? valueM.value / spendM.value : 0,
      previous: spendM.previous ? valueM.previous / spendM.previous : 0,
      spark: sparkline(current(roas, days)),
    },
    series: { spend, conversions },
  };
}

export interface LeadRow {
  id: string;
  name: string;
  source: string;
  service: string;
  receivedAt: string;
  status: "New" | "Contacted" | "Booked" | "Qualified";
  value: number;
}

const FIRST_NAMES = ["Avery", "Jordan", "Priya", "Marcus", "Elena", "Theo", "Naomi", "Diego", "Hannah", "Kenji", "Sofia", "Ruth", "Omar", "Lena", "Caleb", "Mira", "Isaac", "Grace"];
const LAST_INITIALS = ["B.", "C.", "D.", "F.", "G.", "H.", "K.", "L.", "M.", "N.", "P.", "R.", "S.", "T.", "V.", "W."];
const STATUSES: LeadRow["status"][] = ["New", "Contacted", "Qualified", "Booked"];

function recentLeads(client: ClientProfile, s: ClientSeries, days: number, limit: number): { rows: LeadRow[]; total: number } {
  const rows: LeadRow[] = [];
  const total = Math.round(sum(current(s.leadsTotal, days)));
  for (let i = HISTORY_DAYS - 1; i >= HISTORY_DAYS - days && rows.length < limit; i -= 1) {
    const count = Math.round(s.leadsTotal[i]!);
    const rand = seeded("leads", client.id, i);
    for (let n = 0; n < count && rows.length < limit; n += 1) {
      const sourceRoll = rand() * s.leadsTotal[i]!;
      let acc = 0;
      let source = LEAD_SOURCES[0]!;
      for (const candidate of LEAD_SOURCES) {
        acc += s.leads[candidate.key][i]!;
        if (sourceRoll <= acc) {
          source = candidate;
          break;
        }
      }
      const minutes = Math.floor(8 * 60 + rand() * 11 * 60);
      const age = HISTORY_DAYS - 1 - i;
      rows.push({
        id: `${client.id}-${i}-${n}`,
        name: `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${LAST_INITIALS[Math.floor(rand() * LAST_INITIALS.length)]}`,
        source: source.label,
        service: client.services[Math.floor(rand() * client.services.length)]!,
        receivedAt: new Date(new Date(DATES[i]!).getTime() + minutes * 60_000).toISOString(),
        status: age === 0 && rand() < 0.6 ? "New" : STATUSES[1 + Math.floor(rand() * (STATUSES.length - 1))]!,
        value: Math.round((client.monthlyBudget / 40) * (0.5 + rand())),
      });
    }
  }
  rows.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  return { rows, total };
}

export function getOverview(clientId: string, range: RangeKey) {
  const { client, s } = seriesFor(clientId);
  const days = rangeDays(range);
  const ads = adsTotals(s, days);
  const leads = totalMetric(s.leadsTotal, days);

  const reviewsCur = sum(current(s.gbpReviews, days));
  const reviewsPrev = sum(previous(s.gbpReviews, days));
  const reviewsAll = sum(s.gbpReviews);
  const ratingShift = (r: RangeKey) => seededBetween(-0.06, 0.04, client.id, "rating", r);
  const rating = Math.min(5, client.gbp.rating + ratingShift(range));
  const ratingPrev = Math.min(5, client.gbp.rating + ratingShift(range) - seededBetween(-0.03, 0.06, client.id, "rating-prev", range));

  const leadsBySource = LEAD_SOURCES.map(({ key, label, short, color }) => ({
    key,
    label,
    short,
    color,
    value: Math.round(sum(current(s.leads[key], days))),
    previous: Math.round(sum(previous(s.leads[key], days))),
  })).sort((a, b) => b.value - a.value);

  return {
    client,
    days,
    traffic: {
      sessions: totalMetric(s.sessions, days),
      users: totalMetric(s.users, days),
      byChannel: timeline(s.channels, days),
      channelTotals: CHANNELS.map(({ key, label, color }) => ({
        key,
        label,
        color,
        value: Math.round(sum(current(s.channels[key], days))),
      })),
    },
    seo: {
      clicks: totalMetric(s.organicClicks, days),
      position: averageMetric(s.avgPosition, days),
    },
    gbp: {
      views: totalMetric(s.gbpViews, days),
      calls: totalMetric(s.gbpCalls, days),
      directions: totalMetric(s.gbpDirections, days),
      websiteClicks: totalMetric(s.gbpWebsite, days),
      rating: { value: rating, previous: ratingPrev },
      reviews: {
        total: Math.round(client.gbp.reviewsTotal + reviewsAll),
        newInPeriod: Math.round(reviewsCur),
        newPrevious: Math.round(reviewsPrev),
      },
      trend: timeline({ views: s.gbpViews, calls: s.gbpCalls, directions: s.gbpDirections }, days),
    },
    ads: {
      spend: ads.spend,
      roas: ads.roas,
      conversions: ads.conversions,
    },
    leads: {
      count: leads,
      costPerLead: {
        value: leads.value ? ads.spend.value / leads.value : 0,
        previous: leads.previous ? ads.spend.previous / leads.previous : 0,
        spark: sparkline(
          current(
            ads.series.spend.map((sp, i) => (s.leadsTotal[i] ? sp / s.leadsTotal[i]! : 0)),
            days,
          ),
        ),
      },
      bySource: leadsBySource,
      recent: recentLeads(client, s, days, 8),
    },
  };
}

export interface KeywordRow {
  keyword: string;
  url: string;
  volume: number;
  position: number;
  change: number;
  clicks: number;
}

export interface PageRow {
  path: string;
  title: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function getSeo(clientId: string, range: RangeKey) {
  const { client, s } = seriesFor(clientId);
  const days = rangeDays(range);
  const clicks = totalMetric(s.organicClicks, days);
  const impressions = totalMetric(s.impressions, days);
  const position = averageMetric(s.avgPosition, days);
  const ctrSeries = s.organicClicks.map((c, i) => (s.impressions[i] ? c / s.impressions[i]! : 0));

  const keywords: KeywordRow[] = client.keywords.map((k) => {
    const rand = seeded("kw", client.id, k.keyword, range);
    const spread = days === 7 ? 1.2 : days === 30 ? 2.4 : 4;
    const pos = Math.max(1, Math.round(k.position + (rand() - 0.55) * spread));
    const prev = Math.max(1, Math.round(pos + (rand() - 0.35) * spread * 1.6));
    const ctr = pos <= 1 ? 0.3 : pos <= 3 ? 0.16 : pos <= 10 ? 0.05 : pos <= 20 ? 0.012 : 0.003;
    return {
      keyword: k.keyword,
      url: k.url,
      volume: k.volume,
      position: pos,
      change: prev - pos,
      clicks: Math.round(((k.volume * ctr) / 30) * days * (0.85 + rand() * 0.3)),
    };
  });

  const bucketRand = seeded("buckets", client.id, range);
  const bucketShares = [0.07, 0.17, 0.21, 0.27, 0.28];
  const bucketLabels = ["1–3", "4–10", "11–20", "21–50", "51–100"];
  const positionDistribution = bucketLabels.map((label, i) => ({
    label,
    keywords: Math.round(client.rankingKeywords * bucketShares[i]! * (0.88 + bucketRand() * 0.24)),
  }));

  const pageRand = seeded("pages", client.id, range);
  const pages: PageRow[] = client.pages
    .map((p) => {
      const share = p.share * (0.85 + pageRand() * 0.3);
      const pageClicks = Math.round(clicks.value * share);
      const pagePosition = Math.max(1, p.position + (pageRand() - 0.5) * 1.6);
      const pageCtr = Math.min(0.32, (client.organicCtr * 9) / (pagePosition + 6) * (0.85 + pageRand() * 0.3));
      return {
        path: p.path,
        title: p.title,
        clicks: pageClicks,
        impressions: Math.round(pageClicks / pageCtr),
        ctr: pageCtr,
        position: pagePosition,
      };
    })
    .sort((a, b) => b.clicks - a.clicks);

  return {
    client,
    days,
    clicks,
    impressions,
    position,
    ctr: {
      value: impressions.value ? clicks.value / impressions.value : 0,
      previous: impressions.previous ? clicks.previous / impressions.previous : 0,
      spark: sparkline(current(ctrSeries, days)),
    },
    trend: timeline({ clicks: s.organicClicks, impressions: s.impressions }, days),
    keywords,
    positionDistribution,
    rankingKeywords: sum(positionDistribution.map((b) => b.keywords)),
    pages,
  };
}

export interface CampaignRow {
  id: string;
  name: string;
  platform: Platform;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  roas: number;
}

export function getAds(clientId: string, range: RangeKey) {
  const { client, s } = seriesFor(clientId);
  const days = rangeDays(range);
  const totals = adsTotals(s, days);

  const campaigns: CampaignRow[] = client.campaigns.map((c, index) => {
    const series = s.campaigns[index]!;
    const spend = sum(current(series.spend, days));
    const impressions = Math.round(sum(current(series.impressions, days)));
    const clicks = Math.round(sum(current(series.clicks, days)));
    const conversions = Math.round(sum(current(series.conversions, days)));
    const value = sum(current(series.value, days));
    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      objective: c.objective,
      spend,
      impressions,
      clicks,
      ctr: impressions ? clicks / impressions : 0,
      cpc: clicks ? spend / clicks : 0,
      conversions,
      cpa: conversions ? spend / conversions : 0,
      roas: spend ? value / spend : 0,
    };
  });

  const clicksAll = addSeries(s.campaigns.map((c) => c.clicks));
  const impressionsAll = addSeries(s.campaigns.map((c) => c.impressions));
  const budgetForPeriod = (client.monthlyBudget / 30.4) * days;
  const platformPacing = (["Google Ads", "Meta Ads"] as Platform[]).map((platform) => {
    const idx = client.campaigns.map((c, i) => (c.platform === platform ? i : -1)).filter((i) => i >= 0);
    const share = sum(idx.map((i) => client.campaigns[i]!.dailySpend)) / sum(client.campaigns.map((c) => c.dailySpend));
    const spent = sum(idx.map((i) => sum(current(s.campaigns[i]!.spend, days))));
    // Budgets are planned per platform and do not always match delivery exactly.
    const plan = seededBetween(0.9, 1.16, client.id, "budget", platform);
    return { platform, spent, budget: budgetForPeriod * share * plan };
  });
  const plannedBudget = sum(platformPacing.map((p) => p.budget));

  const cpa = {
    value: totals.conversions.value ? totals.spend.value / totals.conversions.value : 0,
    previous: totals.conversions.previous ? totals.spend.previous / totals.conversions.previous : 0,
    spark: sparkline(
      current(
        totals.series.spend.map((sp, i) => (totals.series.conversions[i] ? sp / totals.series.conversions[i]! : 0)),
        days,
      ),
    ),
  };

  return {
    client,
    days,
    spend: totals.spend,
    conversions: totals.conversions,
    roas: totals.roas,
    cpa,
    clicks: totalMetric(clicksAll, days),
    impressions: totalMetric(impressionsAll, days),
    campaigns,
    trend: timeline({ spend: totals.series.spend, conversions: totals.series.conversions }, days),
    pacing: {
      budget: plannedBudget,
      spent: totals.spend.value,
      platforms: platformPacing,
    },
  };
}
