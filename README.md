# Reporting Dashboard Demo

A client-facing marketing reporting dashboard for a fictional agency, **Northwind Digital**. It shows how an agency could present SEO rankings, Google Business Profile performance, website traffic, paid ads results and leads to its own clients in a clean, premium SaaS interface.

**Live demo:** https://noob210.github.io/reporting-dashboard-demo/

> **Sample data.** The agency, its clients (Harbor Dental Group, Summit Roofing, Bloom Bakery), lead names and every metric are fictional. Figures are generated from fixed seeds in TypeScript, so they are identical on every load and there is no backend.

## What's inside

- **Overview** – client and date range selectors (last 7 / 30 / 90 days) that drive every KPI, chart and table:
  - Website traffic: sessions, users, and traffic over time by channel
  - SEO: organic clicks and average position
  - Google Business Profile: profile views, calls, direction requests, rating and reviews, plus an activity trend chart
  - Paid ads: spend, ROAS and conversions
  - Leads: lead count, cost per lead, leads by source and a recent leads table
- **SEO** – keyword rankings table with sorting and search, position distribution, clicks and impressions trend, top landing pages.
- **Paid Ads** – sortable Google Ads and Meta Ads campaign table (spend, impressions, clicks, CTR, CPC, conversions, CPA, ROAS) with a platform filter, spend vs conversions chart and budget pacing.

KPI cards show the headline number, a period-over-period change badge (arrow plus text, not colour alone) and a sparkline. Charts include a written summary for screen reader and keyboard users.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, static export) and React 19
- TypeScript (strict)
- Tailwind CSS 4
- [Recharts](https://recharts.org/) for charts, [lucide-react](https://lucide.dev/) for icons
- Inter, self-hosted through `next/font`
- Playwright for end-to-end checks

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Then open http://localhost:3000/reporting-dashboard-demo/ (the app is always served under the `/reporting-dashboard-demo` base path so it matches GitHub Pages).

Other scripts:

```bash
npm run build      # static export to out/ (also writes out/.nojekyll)
npm run start      # serve out/ at http://127.0.0.1:4173/reporting-dashboard-demo/
npm run lint       # ESLint (next/core-web-vitals + TypeScript rules)
npm run typecheck  # tsc --noEmit
npm run test:e2e   # Playwright checks against the built export
```

The end-to-end suite serves `out/` under `/reporting-dashboard-demo/` and checks that every page and deep link loads without 404s or console errors and warnings, that the client and date range selectors change the KPIs (including the Google Business Profile cards), that tables sort and search, that there is no horizontal page scroll at 390px and 768px, and that the mobile navigation drawer opens, keeps focus inside and closes with Escape. If Chromium is not installed yet, run `npx playwright install chromium` first.

## Deployment

`.github/workflows/deploy.yml` builds the static export on every push to `main` (or on demand) and publishes `out/` to GitHub Pages with `actions/upload-pages-artifact` and `actions/deploy-pages`. In the repository settings, set **Pages → Source** to **GitHub Actions**.

## Project structure

```
src/
  app/          routes: / (overview), /seo, /ads
  components/   layout shell, KPI cards, tables, chart wrappers
  views/        page-level client components
  lib/          seeded sample data, formatting helpers
tests/          static server and Playwright checks
```
