export type ChannelKey = "organic" | "paid" | "direct" | "referral" | "social";
export type LeadSourceKey = "organic" | "googleAds" | "metaAds" | "gbp" | "referral";
export type Platform = "Google Ads" | "Meta Ads";

export interface CampaignProfile {
  id: string;
  name: string;
  platform: Platform;
  objective: string;
  dailySpend: number;
  /** Average cost per click. */
  cpc: number;
  ctr: number;
  cvr: number;
  /** Typical return on ad spend for the campaign type. */
  roas: number;
}

export interface KeywordProfile {
  keyword: string;
  url: string;
  volume: number;
  position: number;
}

export interface PageProfile {
  path: string;
  title: string;
  share: number;
  position: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  industry: string;
  location: string;
  domain: string;
  /** Lower weekend traffic for appointment-led businesses, higher for retail. */
  weekendFactor: number;
  sessionsPerDay: number;
  usersPerSession: number;
  channelMix: Record<ChannelKey, number>;
  organicClicksPerDay: number;
  organicCtr: number;
  avgPosition: number;
  rankingKeywords: number;
  gbp: {
    viewsPerDay: number;
    callsPerDay: number;
    directionsPerDay: number;
    websiteClicksPerDay: number;
    rating: number;
    reviewsTotal: number;
    reviewsPerDay: number;
  };
  leadsPerDay: Record<LeadSourceKey, number>;
  services: string[];
  monthlyBudget: number;
  campaigns: CampaignProfile[];
  keywords: KeywordProfile[];
  pages: PageProfile[];
}

export const CLIENTS: ClientProfile[] = [
  {
    id: "harbor-dental",
    name: "Harbor Dental Group",
    industry: "Dental practice",
    location: "Portland, OR",
    domain: "harbordental.example",
    weekendFactor: 0.62,
    sessionsPerDay: 486,
    usersPerSession: 0.74,
    channelMix: { organic: 0.46, paid: 0.24, direct: 0.17, referral: 0.07, social: 0.06 },
    organicClicksPerDay: 212,
    organicCtr: 0.046,
    avgPosition: 9.8,
    rankingKeywords: 642,
    gbp: {
      viewsPerDay: 318,
      callsPerDay: 14.5,
      directionsPerDay: 9.2,
      websiteClicksPerDay: 21,
      rating: 4.8,
      reviewsTotal: 412,
      reviewsPerDay: 0.55,
    },
    leadsPerDay: { organic: 3.1, googleAds: 2.6, metaAds: 1.1, gbp: 1.8, referral: 0.5 },
    services: ["New patient exam", "Teeth whitening", "Dental implants", "Invisalign consult", "Emergency visit"],
    monthlyBudget: 9800,
    campaigns: [
      { id: "hd-1", name: "Search | Dental Implants", platform: "Google Ads", objective: "Search", dailySpend: 96, cpc: 7.8, ctr: 0.071, cvr: 0.085, roas: 5.4 },
      { id: "hd-2", name: "Search | Emergency Dentist", platform: "Google Ads", objective: "Search", dailySpend: 64, cpc: 5.2, ctr: 0.084, cvr: 0.12, roas: 3.8 },
      { id: "hd-3", name: "Performance Max | New Patients", platform: "Google Ads", objective: "Performance Max", dailySpend: 58, cpc: 2.1, ctr: 0.019, cvr: 0.045, roas: 3.1 },
      { id: "hd-4", name: "Meta | Whitening Offer", platform: "Meta Ads", objective: "Lead form", dailySpend: 42, cpc: 1.4, ctr: 0.014, cvr: 0.05, roas: 2.6 },
      { id: "hd-5", name: "Meta | Invisalign Retargeting", platform: "Meta Ads", objective: "Retargeting", dailySpend: 31, cpc: 1.9, ctr: 0.012, cvr: 0.07, roas: 4.4 },
      { id: "hd-6", name: "Search | Brand", platform: "Google Ads", objective: "Search", dailySpend: 18, cpc: 1.6, ctr: 0.16, cvr: 0.16, roas: 9.2 },
    ],
    keywords: [
      { keyword: "dentist portland", url: "/", volume: 6600, position: 4 },
      { keyword: "dental implants portland", url: "/services/dental-implants/", volume: 1900, position: 6 },
      { keyword: "emergency dentist near me", url: "/emergency-dentist/", volume: 12100, position: 9 },
      { keyword: "teeth whitening portland", url: "/services/teeth-whitening/", volume: 880, position: 3 },
      { keyword: "invisalign portland", url: "/services/invisalign/", volume: 1300, position: 7 },
      { keyword: "family dentist portland or", url: "/family-dentistry/", volume: 720, position: 2 },
      { keyword: "dental crown cost", url: "/blog/dental-crown-cost/", volume: 5400, position: 14 },
      { keyword: "pediatric dentist portland", url: "/family-dentistry/", volume: 1000, position: 11 },
      { keyword: "same day dental crown", url: "/services/crowns/", volume: 590, position: 8 },
      { keyword: "root canal specialist", url: "/services/root-canal/", volume: 2400, position: 17 },
      { keyword: "harbor dental group", url: "/", volume: 390, position: 1 },
      { keyword: "dentist that takes delta dental", url: "/insurance/", volume: 1600, position: 12 },
      { keyword: "sedation dentistry portland", url: "/services/sedation/", volume: 320, position: 5 },
      { keyword: "how long do dental implants last", url: "/blog/implant-lifespan/", volume: 2900, position: 21 },
      { keyword: "cosmetic dentist portland", url: "/cosmetic-dentistry/", volume: 1000, position: 10 },
    ],
    pages: [
      { path: "/", title: "Home", share: 0.27, position: 4.1 },
      { path: "/emergency-dentist/", title: "Emergency Dentist", share: 0.17, position: 7.9 },
      { path: "/services/dental-implants/", title: "Dental Implants", share: 0.13, position: 6.2 },
      { path: "/blog/dental-crown-cost/", title: "How Much Does a Crown Cost?", share: 0.11, position: 12.8 },
      { path: "/services/invisalign/", title: "Invisalign", share: 0.08, position: 7.4 },
      { path: "/family-dentistry/", title: "Family Dentistry", share: 0.07, position: 5.3 },
      { path: "/services/teeth-whitening/", title: "Teeth Whitening", share: 0.06, position: 3.6 },
      { path: "/insurance/", title: "Insurance & Financing", share: 0.04, position: 11.7 },
    ],
  },
  {
    id: "summit-roofing",
    name: "Summit Roofing",
    industry: "Home services",
    location: "Denver, CO",
    domain: "summitroofing.example",
    weekendFactor: 0.55,
    sessionsPerDay: 274,
    usersPerSession: 0.79,
    channelMix: { organic: 0.39, paid: 0.33, direct: 0.14, referral: 0.09, social: 0.05 },
    organicClicksPerDay: 104,
    organicCtr: 0.038,
    avgPosition: 12.6,
    rankingKeywords: 418,
    gbp: {
      viewsPerDay: 196,
      callsPerDay: 11.2,
      directionsPerDay: 3.1,
      websiteClicksPerDay: 13,
      rating: 4.7,
      reviewsTotal: 238,
      reviewsPerDay: 0.32,
    },
    leadsPerDay: { organic: 1.9, googleAds: 2.9, metaAds: 0.9, gbp: 1.6, referral: 0.8 },
    services: ["Roof replacement", "Storm damage inspection", "Roof repair", "Gutter installation", "Commercial roofing"],
    monthlyBudget: 14200,
    campaigns: [
      { id: "sr-1", name: "Search | Roof Replacement", platform: "Google Ads", objective: "Search", dailySpend: 148, cpc: 11.5, ctr: 0.062, cvr: 0.07, roas: 7.8 },
      { id: "sr-2", name: "Search | Storm Damage", platform: "Google Ads", objective: "Search", dailySpend: 92, cpc: 9.2, ctr: 0.069, cvr: 0.08, roas: 6.1 },
      { id: "sr-3", name: "Local Services | Roofers", platform: "Google Ads", objective: "Local Services", dailySpend: 74, cpc: 14.0, ctr: 0.052, cvr: 0.14, roas: 5.2 },
      { id: "sr-4", name: "Meta | Free Inspection", platform: "Meta Ads", objective: "Lead form", dailySpend: 61, cpc: 2.3, ctr: 0.011, cvr: 0.045, roas: 3.4 },
      { id: "sr-5", name: "Meta | Homeowner Lookalike", platform: "Meta Ads", objective: "Awareness", dailySpend: 38, cpc: 1.7, ctr: 0.009, cvr: 0.02, roas: 1.9 },
      { id: "sr-6", name: "Performance Max | Gutters", platform: "Google Ads", objective: "Performance Max", dailySpend: 35, cpc: 3.4, ctr: 0.017, cvr: 0.04, roas: 2.8 },
    ],
    keywords: [
      { keyword: "roofing company denver", url: "/", volume: 2900, position: 7 },
      { keyword: "roof replacement cost denver", url: "/roof-replacement/", volume: 1300, position: 5 },
      { keyword: "hail damage roof repair", url: "/storm-damage/", volume: 2400, position: 9 },
      { keyword: "roof repair near me", url: "/roof-repair/", volume: 14800, position: 16 },
      { keyword: "summit roofing denver", url: "/", volume: 260, position: 1 },
      { keyword: "metal roofing contractors", url: "/metal-roofing/", volume: 1900, position: 13 },
      { keyword: "gutter installation denver", url: "/gutters/", volume: 720, position: 6 },
      { keyword: "commercial roofing denver", url: "/commercial/", volume: 590, position: 11 },
      { keyword: "how long does a roof last", url: "/blog/roof-lifespan/", volume: 6600, position: 19 },
      { keyword: "roof inspection cost", url: "/blog/inspection-cost/", volume: 3600, position: 15 },
      { keyword: "insurance claim roof damage", url: "/storm-damage/insurance/", volume: 1600, position: 8 },
      { keyword: "asphalt shingle colors", url: "/blog/shingle-colors/", volume: 2400, position: 24 },
      { keyword: "flat roof repair denver", url: "/roof-repair/flat-roof/", volume: 390, position: 4 },
      { keyword: "emergency roof tarp", url: "/emergency/", volume: 880, position: 10 },
    ],
    pages: [
      { path: "/", title: "Home", share: 0.23, position: 6.4 },
      { path: "/storm-damage/", title: "Storm & Hail Damage", share: 0.19, position: 8.7 },
      { path: "/roof-replacement/", title: "Roof Replacement", share: 0.15, position: 6.1 },
      { path: "/blog/roof-lifespan/", title: "How Long Does a Roof Last?", share: 0.12, position: 17.2 },
      { path: "/roof-repair/", title: "Roof Repair", share: 0.1, position: 13.9 },
      { path: "/gutters/", title: "Gutter Installation", share: 0.06, position: 6.8 },
      { path: "/commercial/", title: "Commercial Roofing", share: 0.05, position: 10.5 },
      { path: "/blog/inspection-cost/", title: "Roof Inspection Cost Guide", share: 0.04, position: 14.6 },
    ],
  },
  {
    id: "bloom-bakery",
    name: "Bloom Bakery",
    industry: "Bakery & cafe",
    location: "Austin, TX",
    domain: "bloombakery.example",
    weekendFactor: 1.38,
    sessionsPerDay: 612,
    usersPerSession: 0.69,
    channelMix: { organic: 0.41, paid: 0.15, direct: 0.21, referral: 0.05, social: 0.18 },
    organicClicksPerDay: 238,
    organicCtr: 0.052,
    avgPosition: 8.1,
    rankingKeywords: 527,
    gbp: {
      viewsPerDay: 742,
      callsPerDay: 9.6,
      directionsPerDay: 38.4,
      websiteClicksPerDay: 44,
      rating: 4.9,
      reviewsTotal: 1184,
      reviewsPerDay: 1.9,
    },
    leadsPerDay: { organic: 1.4, googleAds: 0.9, metaAds: 1.5, gbp: 1.1, referral: 0.4 },
    services: ["Custom cake order", "Wedding cake tasting", "Catering inquiry", "Corporate gift boxes", "Pastry class booking"],
    monthlyBudget: 4300,
    campaigns: [
      { id: "bb-1", name: "Meta | Weekend Brunch", platform: "Meta Ads", objective: "Traffic", dailySpend: 34, cpc: 0.9, ctr: 0.016, cvr: 0.03, roas: 2.2 },
      { id: "bb-2", name: "Meta | Custom Cakes", platform: "Meta Ads", objective: "Lead form", dailySpend: 29, cpc: 1.1, ctr: 0.015, cvr: 0.05, roas: 3.6 },
      { id: "bb-3", name: "Search | Custom Cakes Austin", platform: "Google Ads", objective: "Search", dailySpend: 27, cpc: 2.4, ctr: 0.088, cvr: 0.08, roas: 4.9 },
      { id: "bb-4", name: "Search | Catering", platform: "Google Ads", objective: "Search", dailySpend: 21, cpc: 3.1, ctr: 0.064, cvr: 0.06, roas: 6.3 },
      { id: "bb-5", name: "Performance Max | Gift Boxes", platform: "Google Ads", objective: "Performance Max", dailySpend: 19, cpc: 1.3, ctr: 0.021, cvr: 0.045, roas: 3.1 },
      { id: "bb-6", name: "Meta | Wedding Season", platform: "Meta Ads", objective: "Awareness", dailySpend: 13, cpc: 0.8, ctr: 0.01, cvr: 0.015, roas: 1.6 },
    ],
    keywords: [
      { keyword: "bakery austin", url: "/", volume: 8100, position: 3 },
      { keyword: "custom cakes austin", url: "/custom-cakes/", volume: 2400, position: 2 },
      { keyword: "best croissants austin", url: "/menu/pastries/", volume: 1300, position: 4 },
      { keyword: "wedding cakes austin tx", url: "/weddings/", volume: 1900, position: 6 },
      { keyword: "bloom bakery", url: "/", volume: 1600, position: 1 },
      { keyword: "brunch near me", url: "/menu/brunch/", volume: 90500, position: 27 },
      { keyword: "gluten free bakery austin", url: "/menu/gluten-free/", volume: 720, position: 5 },
      { keyword: "birthday cake delivery", url: "/custom-cakes/delivery/", volume: 4400, position: 13 },
      { keyword: "catering austin", url: "/catering/", volume: 3600, position: 15 },
      { keyword: "sourdough bread recipe", url: "/journal/sourdough/", volume: 49500, position: 34 },
      { keyword: "coffee shop south congress", url: "/locations/south-congress/", volume: 880, position: 7 },
      { keyword: "corporate gift boxes austin", url: "/gifts/", volume: 320, position: 9 },
      { keyword: "baking classes austin", url: "/classes/", volume: 1000, position: 8 },
      { keyword: "kouign amann", url: "/journal/kouign-amann/", volume: 6600, position: 18 },
    ],
    pages: [
      { path: "/", title: "Home", share: 0.24, position: 3.8 },
      { path: "/menu/", title: "Menu", share: 0.18, position: 5.6 },
      { path: "/custom-cakes/", title: "Custom Cakes", share: 0.14, position: 3.1 },
      { path: "/journal/sourdough/", title: "Our Sourdough Method", share: 0.12, position: 21.4 },
      { path: "/weddings/", title: "Wedding Cakes", share: 0.08, position: 6.3 },
      { path: "/locations/south-congress/", title: "South Congress Cafe", share: 0.07, position: 6.9 },
      { path: "/catering/", title: "Catering", share: 0.05, position: 13.2 },
      { path: "/classes/", title: "Baking Classes", share: 0.04, position: 8.4 },
    ],
  },
];

export const DEFAULT_CLIENT_ID = CLIENTS[0]!.id;

export function getClient(id: string): ClientProfile {
  return CLIENTS.find((client) => client.id === id) ?? CLIENTS[0]!;
}

export const CHANNELS: Array<{ key: ChannelKey; label: string; color: string }> = [
  { key: "organic", label: "Organic search", color: "#4f46e5" },
  { key: "paid", label: "Paid search & social", color: "#0ea5e9" },
  { key: "direct", label: "Direct", color: "#14b8a6" },
  { key: "referral", label: "Referral", color: "#f59e0b" },
  { key: "social", label: "Organic social", color: "#e11d48" },
];

export const LEAD_SOURCES: Array<{ key: LeadSourceKey; label: string; short: string; color: string }> = [
  { key: "organic", short: "Organic search", label: "Organic search", color: "#4f46e5" },
  { key: "googleAds", short: "Google Ads", label: "Google Ads", color: "#0ea5e9" },
  { key: "metaAds", short: "Meta Ads", label: "Meta Ads", color: "#8b5cf6" },
  { key: "gbp", short: "Business Profile", label: "Google Business Profile", color: "#14b8a6" },
  { key: "referral", short: "Referral", label: "Referral", color: "#f59e0b" },
];
