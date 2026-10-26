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
    assert(same.length === 0, `KPIs unchanged after client change: ${same.join(", ")}`);
    await t.page.getByLabel("Client").selectOption({ label: "Bloom Bakery" });
    const after2 = await kpis(t.page, ids);
    assert(changedAll(after, after2).length === 0, "KPIs unchanged after switching to Bloom Bakery");
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
