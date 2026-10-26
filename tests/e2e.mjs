// End-to-end checks against the static export served under /reporting-dashboard-demo/.
// Usage: npm run build && npm run test:e2e
import { chromium } from "playwright";
import { BASE, startServer } from "./serve.mjs";

const PAGES = [
  { path: "/", heading: "Marketing overview" },
  { path: "/seo/", heading: "SEO performance" },
  { path: "/ads/", heading: "Paid ads" },
];

const results = [];
let browser;
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Opens a page that records console errors/warnings, page errors and failed responses. */
async function openPage(viewport = { width: 1280, height: 800 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const problems = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") problems.push(`console.${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
  });
  page.on("requestfailed", (req) => problems.push(`request failed: ${req.url()} (${req.failure()?.errorText})`));
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.origin === server.origin && !url.pathname.startsWith(`${BASE}/`)) {
      problems.push(`request outside base path: ${url.pathname}`);
    }
  });
  return {
    page,
    problems,
    close: () => context.close(),
    assertClean: () => assert(problems.length === 0, `Unexpected problems:\n  ${problems.join("\n  ")}`),
  };
}

const url = (path) => `${server.origin}${BASE}${path}`;

async function kpi(page, id) {
  return (await page.locator(`[data-kpi="${id}"] [data-kpi-value]`).first().innerText()).trim();
}

async function kpis(page, ids) {
  const out = {};
  for (const id of ids) out[id] = await kpi(page, id);
  return out;
}

function changedAll(before, after) {
  return Object.keys(before).filter((k) => before[k] === after[k]);
}

async function test(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name} (${Date.now() - started} ms)`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  ✗ ${name}\n      ${String(err.message).split("\n").join("\n      ")}`);
  }
}

async function main() {
  server = await startServer();
  browser = await chromium.launch();
  console.log(`Serving static export at ${server.origin}${BASE}/\n`);

  for (const { path, heading } of PAGES) {
    await test(`deep link ${BASE}${path} loads with no 404s or console errors/warnings`, async () => {
      const t = await openPage();
      const res = await t.page.goto(url(path), { waitUntil: "networkidle" });
      assert(res?.status() === 200, `Expected 200, got ${res?.status()}`);
      await t.page.getByRole("heading", { level: 1, name: heading }).waitFor();
      const font = await t.page.evaluate(() => getComputedStyle(document.body).fontFamily);
      assert(/inter/i.test(font), `Body font is not Inter: ${font}`);
      const fontsLoaded = await t.page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts].some((f) => /inter/i.test(f.family) && f.status === "loaded");
      });
      assert(fontsLoaded, "Inter web font did not load");
      const charts = await t.page.locator(".recharts-surface").count();
      assert(charts > 0, "No charts rendered");
      // Give hydration and charts a moment to report any late warnings.
      await t.page.waitForTimeout(400);
      t.assertClean();
      await t.close();
    });
  }

  await test("client-side navigation between pages keeps the base path", async () => {
    const t = await openPage();
    await t.page.goto(url("/"), { waitUntil: "networkidle" });
    await t.page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "SEO" }).click();
    await t.page.getByRole("heading", { level: 1, name: "SEO performance" }).waitFor();
    assert(new URL(t.page.url()).pathname === `${BASE}/seo/`, `Unexpected URL ${t.page.url()}`);
    await t.page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Paid Ads" }).click();
    await t.page.getByRole("heading", { level: 1, name: "Paid ads" }).waitFor();
    assert(new URL(t.page.url()).pathname === `${BASE}/ads/`, `Unexpected URL ${t.page.url()}`);
    await t.page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Overview" }).click();
    await t.page.getByRole("heading", { level: 1, name: "Marketing overview" }).waitFor();
    t.assertClean();
    await t.close();
  });

  const overviewIds = ["sessions", "users", "organic-clicks", "ad-spend", "conversions", "leads", "cpl"];
  const gbpIds = ["gbp-views", "gbp-calls", "gbp-directions"];

  await test("overview: changing the date range changes KPI values", async () => {
    const t = await openPage();
    await t.page.goto(url("/"), { waitUntil: "networkidle" });
    const before = await kpis(t.page, overviewIds);
    await t.page.getByLabel("Date range").selectOption("7d");
    const after = await kpis(t.page, overviewIds);
    const same = changedAll(before, after);
    assert(same.length === 0, `KPIs unchanged after range change: ${same.join(", ")}`);
    await t.page.getByLabel("Date range").selectOption("90d");
    const after90 = await kpis(t.page, overviewIds);
    assert(changedAll(after, after90).length === 0, "KPIs unchanged after switching to 90 days");
    const period = await t.page.getByTestId("period").innerText();
    assert(/previous 90 days/.test(period), `Period label not updated: ${period}`);
    t.assertClean();
    await t.close();
  });

  await test("overview: changing the client changes KPI values and header", async () => {
    const t = await openPage();
    await t.page.goto(url("/"), { waitUntil: "networkidle" });
    const ids = [...overviewIds, ...gbpIds];
    const before = await kpis(t.page, ids);
    await t.page.getByLabel("Client").selectOption({ label: "Summit Roofing" });
    await t.page.locator("main").getByText("Summit Roofing").first().waitFor();
    const after = await kpis(t.page, ids);
    const same = changedAll(before, after);
    await t.page.getByLabel("Client").selectOption({ label: "Bloom Bakery" });
    const after2 = await kpis(t.page, ids);
    const same2 = changedAll(after, after2);
    // Two clients can legitimately share one rounded figure; allow one coincidence per switch,
    // but every KPI must change on at least one of the switches.
    assert(same.length <= 1, `KPIs unchanged after switching to Summit Roofing: ${same.join(", ")}`);
    assert(same2.length <= 1, `KPIs unchanged after switching to Bloom Bakery: ${same2.join(", ")}`);
    const neverChanged = same.filter((id) => same2.includes(id));
    assert(neverChanged.length === 0, `KPIs never changed with the client: ${neverChanged.join(", ")}`);
    t.assertClean();
    await t.close();
  });

  await test("overview: Google Business Profile KPIs and trend chart are present and follow the date range", async () => {
    const t = await openPage();
    await t.page.goto(url("/"), { waitUntil: "networkidle" });
    await t.page.getByRole("heading", { level: 2, name: "Google Business Profile" }).waitFor();
    for (const id of [...gbpIds, "gbp-rating"]) {
      assert((await t.page.locator(`[data-kpi="${id}"]`).count()) === 1, `Missing GBP KPI ${id}`);
    }
    assert(await t.page.getByRole("figure", { name: /Google Business Profile views/ }).isVisible(), "GBP trend chart missing");
    const before = await kpis(t.page, gbpIds);
    const reviewsBefore = await t.page.locator('[data-kpi="gbp-rating"]').innerText();
    await t.page.getByLabel("Date range").selectOption("90d");
    const after = await kpis(t.page, gbpIds);
    const same = changedAll(before, after);
    assert(same.length === 0, `GBP KPIs unchanged after range change: ${same.join(", ")}`);
    const reviewsAfter = await t.page.locator('[data-kpi="gbp-rating"]').innerText();
    assert(reviewsBefore !== reviewsAfter, "Rating card did not change with the date range");
    t.assertClean();
    await t.close();
  });

  await test("seo: date range changes KPIs; keyword table sorts and searches", async () => {
    const t = await openPage();
    await t.page.goto(url("/seo/"), { waitUntil: "networkidle" });
    const ids = ["seo-clicks", "seo-impressions"];
    const before = await kpis(t.page, ids);
    await t.page.getByLabel("Date range").selectOption("90d");
    const after = await kpis(t.page, ids);
    assert(changedAll(before, after).length === 0, "SEO KPIs unchanged after range change");

    const table = t.page.getByRole("table", { name: "Keyword rankings" });
    const firstKeyword = () => table.locator("tbody tr").first().locator("td").first().innerText();
    const initial = await firstKeyword();
    await table.getByRole("button", { name: /^Volume/ }).click();
    const byVolume = await firstKeyword();
    assert(initial !== byVolume, "Sorting by volume did not reorder rows");
    const sortState = await table.locator("th", { hasText: "Volume" }).getAttribute("aria-sort");
    assert(sortState === "descending", `Expected aria-sort descending, got ${sortState}`);

    await t.page.getByLabel("Search keywords").fill("zzzz-no-match");
    await table.getByText("No keywords match").waitFor();
    await t.page.getByLabel("Search keywords").fill(byVolume.slice(0, 6));
    const count = await table.locator("tbody tr").count();
    assert(count >= 1, "Search returned no rows for an existing keyword");
    t.assertClean();
    await t.close();
  });

  await test("ads: date range and client change KPIs; campaign table sorts", async () => {
    const t = await openPage();
    await t.page.goto(url("/ads/"), { waitUntil: "networkidle" });
    const ids = ["ads-spend", "ads-conversions", "ads-roas"];
    const before = await kpis(t.page, ids);
    await t.page.getByLabel("Date range").selectOption("7d");
    const after = await kpis(t.page, ids);
    assert(changedAll(before, after).length === 0, "Ads KPIs unchanged after range change");
    await t.page.getByLabel("Client").selectOption({ label: "Bloom Bakery" });
    const after2 = await kpis(t.page, ids);
    assert(changedAll(after, after2).length === 0, "Ads KPIs unchanged after client change");

    const table = t.page.getByRole("table", { name: "Campaign performance" });
    const first = () => table.locator("tbody tr").first().locator("td").first().innerText();
    const initial = await first();
    await table.getByRole("button", { name: /^ROAS/ }).click();
    const byRoas = await first();
    await table.getByRole("button", { name: /^ROAS/ }).click();
    const byRoasAsc = await first();
    assert(initial !== byRoas || byRoas !== byRoasAsc, "Sorting by ROAS did not reorder rows");
    assert(await t.page.getByRole("progressbar", { name: "All platforms budget used" }).isVisible(), "Budget pacing bar missing");
    t.assertClean();
    await t.close();
  });

  const CLIENT_IDS = ["harbor-dental", "summit-roofing", "bloom-bakery"];
  const RANGE_KEYS = ["7d", "30d", "90d"];
  const num = (text) => Number(String(text).replace(/[^0-9.\-]/g, ""));

  await test("ads: KPI cards, pacing and campaign totals agree for every client and range", async () => {
    const t = await openPage();
    await t.page.goto(url("/ads/"), { waitUntil: "networkidle" });
    const table = t.page.getByRole("table", { name: "Campaign performance" });
    for (const client of CLIENT_IDS) {
      for (const range of RANGE_KEYS) {
        await t.page.getByLabel("Client").selectOption(client);
        await t.page.getByLabel("Date range").selectOption(range);
        const label = `${client} ${range}`;
        const k = await kpis(t.page, ["ads-spend", "ads-conversions", "ads-cpa", "ads-roas"]);
        const foot = await table.locator("tfoot td").allInnerTexts();
        const [spend, , , , , conv, cpa, roas] = foot;
        assert(k["ads-spend"] === spend, `${label}: spend KPI ${k["ads-spend"]} != table total ${spend}`);
        assert(k["ads-conversions"] === conv, `${label}: conversions KPI ${k["ads-conversions"]} != table total ${conv}`);
        assert(k["ads-cpa"] === cpa, `${label}: CPA KPI ${k["ads-cpa"]} != table total ${cpa}`);
        assert(k["ads-roas"] === roas, `${label}: ROAS KPI ${k["ads-roas"]} != table total ${roas}`);

        const rowSpend = (await table.locator("tbody tr").evaluateAll((rows) => rows.map((r) => r.children[1]?.textContent ?? "")))
          .reduce((total, v) => total + num(v), 0);
        const rowConv = (await table.locator("tbody tr").evaluateAll((rows) => rows.map((r) => r.children[6]?.textContent ?? "")))
          .reduce((total, v) => total + num(v), 0);
        assert(rowSpend === num(spend), `${label}: campaign spend rows sum to ${rowSpend}, total shows ${spend}`);
        assert(rowConv === num(conv), `${label}: campaign conversion rows sum to ${rowConv}, total shows ${conv}`);

        const pacing = await t.page.locator("#pacing-title").locator("xpath=ancestor::section").locator("[data-pacing]").evaluateAll((els) =>
          els.map((el) => ({ spent: el.getAttribute("data-spent"), budget: el.getAttribute("data-budget") })),
        );
        const [all, ...platforms] = pacing.map((p) => ({ spent: Number(p.spent), budget: Number(p.budget) }));
        assert(all && platforms.length === 2, `${label}: pacing bars missing`);
        const pSpent = platforms.reduce((x, p) => x + p.spent, 0);
        const pBudget = platforms.reduce((x, p) => x + p.budget, 0);
        assert(pSpent === all.spent, `${label}: platform spend ${pSpent} != all platforms ${all.spent}`);
        assert(pBudget === all.budget, `${label}: platform budgets ${pBudget} != all platforms ${all.budget}`);
        assert(all.spent === num(spend), `${label}: pacing spend ${all.spent} != spend KPI ${spend}`);
      }
    }
    t.assertClean();
    await t.close();
  });

  await test("overview: leads by source bars add up to the leads KPI and chart summary for every client and range", async () => {
    const t = await openPage();
    await t.page.goto(url("/"), { waitUntil: "networkidle" });
    const figure = t.page.getByRole("figure", { name: "Horizontal bar chart of leads by source" });
    for (const client of CLIENT_IDS) {
      for (const range of RANGE_KEYS) {
        await t.page.getByLabel("Client").selectOption(client);
        await t.page.getByLabel("Date range").selectOption(range);
        const label = `${client} ${range}`;
        const leadsKpi = num(await kpi(t.page, "leads"));
        const bars = (await figure.locator(".recharts-label-list text").allTextContents()).map(num);
        assert(bars.length === 5, `${label}: expected 5 bar labels, got ${bars.length}`);
        const barSum = bars.reduce((x, v) => x + v, 0);
        const summary = await figure.locator("figcaption").innerText();
        const summaryTotal = num(summary.match(/^([\d,]+) leads/)?.[1] ?? "NaN");
        const [, topCount, topPct] = summary.match(/\(([\d,]+), (\d+)%\)/) ?? [];
        assert(barSum === leadsKpi, `${label}: bars sum to ${barSum}, Leads KPI shows ${leadsKpi}`);
        assert(summaryTotal === barSum, `${label}: summary says ${summaryTotal} leads, bars sum to ${barSum}`);
        assert(num(topCount) === Math.max(...bars), `${label}: summary top source ${topCount} != largest bar ${Math.max(...bars)}`);
        assert(Number(topPct) === Math.round((Math.max(...bars) / barSum) * 100), `${label}: summary share ${topPct}% is not consistent`);
        const recent = await t.page.locator("#recent-leads-title").locator("xpath=..").innerText();
        assert(new RegExp(`of ${leadsKpi.toLocaleString("en-US")} leads`).test(recent), `${label}: recent leads count does not match KPI`);
      }
    }
    t.assertClean();
    await t.close();
  });

  const expectedPacing = (percent) => (percent > 100 ? "Over budget" : percent < 90 ? "Under-pacing" : "On pace");

  await test("ads: budget pacing labels follow the 90% / 100% thresholds for every client and range", async () => {
    const t = await openPage();
    await t.page.goto(url("/ads/"), { waitUntil: "networkidle" });
    let overBudgetSeen = 0;
    for (const client of CLIENT_IDS) {
      for (const range of RANGE_KEYS) {
        await t.page.getByLabel("Client").selectOption(client);
        await t.page.getByLabel("Date range").selectOption(range);
        const rows = await t.page.locator("[data-pacing]").evaluateAll((els) =>
          els.map((el) => {
            const spans = el.querySelectorAll(":scope > div:last-child > span");
            return { used: spans[0]?.textContent ?? "", status: spans[1]?.textContent ?? "" };
          }),
        );
        assert(rows.length === 3, `${client} ${range}: expected 3 pacing rows`);
        for (const row of rows) {
          const percent = num(row.used);
          const label = `${client} ${range} (${row.used})`;
          assert(!(percent > 100 && row.status === "On pace"), `${label}: over 100% labelled On pace`);
          assert(row.status === expectedPacing(percent), `${label}: expected "${expectedPacing(percent)}", got "${row.status}"`);
          if (row.status === "Over budget") overBudgetSeen += 1;
        }
      }
    }
    assert(overBudgetSeen > 0, "Sample data never exercised the Over budget state");
    t.assertClean();
    await t.close();
  });

  await test("absolute-unit deltas (avg. position, rating) never show a % sign, including zero", async () => {
    const t = await openPage();
    const checks = [
      { path: "/", ids: ["avg-position", "gbp-rating"] },
      { path: "/seo/", ids: ["seo-position"] },
    ];
    let zeroSeen = 0;
    for (const { path, ids } of checks) {
      await t.page.goto(url(path), { waitUntil: "networkidle" });
      for (const client of CLIENT_IDS) {
        for (const range of RANGE_KEYS) {
          await t.page.getByLabel("Client").selectOption(client);
          await t.page.getByLabel("Date range").selectOption(range);
          for (const id of ids) {
            const full = (await t.page.locator(`[data-kpi="${id}"] [data-delta]`).innerText()).trim();
            assert(!full.includes("%"), `${path} ${client} ${range} ${id}: delta "${full}" contains %`);
            // Visible value only; the screen reader suffix "(Up, improvement)" follows it.
            const badge = full.split(/\s*\(/)[0].trim();
            assert(!badge.includes("%"), `${path} ${client} ${range} ${id}: delta "${badge}" contains %`);
            assert(/^(?:[+−]?\d+\.\d)$/.test(badge), `${path} ${client} ${range} ${id}: unexpected delta format "${badge}"`);
            if (badge === "0.0") zeroSeen += 1;
          }
        }
      }
    }
    assert(zeroSeen > 0, "No zero delta case was exercised");
    t.assertClean();
    await t.close();
  });

  for (const { path } of PAGES) {
    await test(`charts on ${path} have no unnamed application roles or focusable svgs`, async () => {
      const t = await openPage();
      await t.page.goto(url(path), { waitUntil: "networkidle" });
      for (const client of CLIENT_IDS) {
        for (const range of RANGE_KEYS) {
          await t.page.getByLabel("Client").selectOption(client);
          await t.page.getByLabel("Date range").selectOption(range);
          const issues = await t.page.evaluate(() => {
            const named = (el) =>
              !!(el.getAttribute("aria-label")?.trim() || (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent?.trim()) || el.querySelector(":scope > title")?.textContent?.trim());
            const out = [];
            for (const el of document.querySelectorAll('[role="application"]')) if (!named(el)) out.push(`unnamed role=application <${el.tagName.toLowerCase()} class="${el.getAttribute("class")}">`);
            for (const el of document.querySelectorAll("svg")) {
              const ti = el.getAttribute("tabindex");
              if (ti !== null && Number(ti) >= 0 && !named(el)) out.push(`unnamed focusable svg class="${el.getAttribute("class")}"`);
            }
            for (const el of document.querySelectorAll(".recharts-wrapper, .recharts-surface")) {
              const ti = el.getAttribute("tabindex");
              if (ti !== null && Number(ti) >= 0 && !named(el)) out.push(`unnamed tab stop on ${el.getAttribute("class")}`);
            }
            return out;
          });
          assert(issues.length === 0, `${client} ${range}: ${issues.join("; ")}`);
          const figures = await t.page.locator("figure[aria-label]").count();
          const captions = await t.page.locator("figure[aria-label] figcaption").count();
          assert(figures > 0 && figures === captions, `${client} ${range}: chart figures lost their label or text summary`);
        }
      }
      t.assertClean();
      await t.close();
    });
  }

  await test("table sort-header buttons are at least 24x24px at 390px on every page", async () => {
    const t = await openPage({ width: 390, height: 844 });
    for (const { path } of PAGES) {
      await t.page.goto(url(path), { waitUntil: "networkidle" });
      const sizes = await t.page.locator("th button").evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { name: el.textContent?.trim(), w: r.width, h: r.height };
        }),
      );
      assert(sizes.length > 0, `${path}: no sort buttons found`);
      const small = sizes.filter((s) => s.h < 24 || s.w < 24);
      assert(small.length === 0, `${path}: undersized sort buttons ${JSON.stringify(small)}`);
    }
    t.assertClean();
    await t.close();
  });

  await test("export button shows a toast and does not error", async () => {
    const t = await openPage();
    await t.page.goto(url("/"), { waitUntil: "networkidle" });
    await t.page.getByRole("button", { name: "Export" }).filter({ visible: true }).first().click();
    await t.page.getByTestId("toast").getByText("Export is disabled in this demo").waitFor();
    t.assertClean();
    await t.close();
  });

  for (const width of [390, 768]) {
    for (const { path } of PAGES) {
      await test(`no horizontal page overflow at ${width}px on ${path}`, async () => {
        const t = await openPage({ width, height: 844 });
        await t.page.goto(url(path), { waitUntil: "networkidle" });
        await t.page.waitForTimeout(300);
        const dims = await t.page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          body: document.body.scrollWidth,
        }));
        assert(dims.scroll <= dims.client && dims.body <= dims.client, `Overflow: ${JSON.stringify(dims)}`);
        t.assertClean();
        await t.close();
      });
    }
  }

  await test("mobile drawer opens, traps focus, closes with Escape and the close button", async () => {
    const t = await openPage({ width: 390, height: 844 });
    await t.page.goto(url("/"), { waitUntil: "networkidle" });
    const sidebar = t.page.locator('aside[aria-label="Sidebar"]');
    assert(!(await sidebar.isVisible()), "Desktop sidebar should be hidden at 390px");
    const menu = t.page.getByRole("button", { name: "Open navigation" });
    await menu.click();
    const dialog = t.page.getByRole("dialog", { name: "Navigation" });
    await dialog.waitFor();
    assert((await menu.getAttribute("aria-expanded")) === "true", "aria-expanded not true when open");
    const focusInside = await t.page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    assert(focusInside, "Focus did not move into the drawer");
    for (let i = 0; i < 8; i += 1) await t.page.keyboard.press("Tab");
    const stillInside = await t.page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    assert(stillInside, "Focus escaped the drawer while tabbing");
    await t.page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    const focusReturned = await t.page.evaluate(() => document.activeElement?.getAttribute("aria-controls") === "mobile-navigation");
    assert(focusReturned, "Focus did not return to the menu button");

    await menu.click();
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "Close navigation" }).click();
    await dialog.waitFor({ state: "detached" });

    await menu.click();
    await dialog.getByRole("link", { name: "SEO" }).click();
    await t.page.getByRole("heading", { level: 1, name: "SEO performance" }).waitFor();
    assert((await t.page.getByRole("dialog").count()) === 0, "Drawer stayed open after navigating");
    t.assertClean();
    await t.close();
  });

  await browser.close();
  await server.close();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n${passed} passed, ${failed} failed, ${results.length} total`);
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await browser?.close();
  await server?.close();
  process.exit(1);
});
