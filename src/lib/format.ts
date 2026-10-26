const LOCALE = "en-US";

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const decimal1 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const decimal2 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const currency0 = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const currency2 = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const currencyCompact = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const percent1 = new Intl.NumberFormat(LOCALE, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const percent0 = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 });
const signedPercent = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
const shortDate = new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export const fmt = {
  int: (n: number) => integer.format(n),
  compact: (n: number) => compact.format(n),
  dec1: (n: number) => decimal1.format(n),
  dec2: (n: number) => decimal2.format(n),
  usd: (n: number) => currency0.format(n),
  usd2: (n: number) => currency2.format(n),
  usdCompact: (n: number) => currencyCompact.format(n),
  pct: (ratio: number) => percent1.format(ratio),
  pct0: (ratio: number) => percent0.format(ratio),
  signedPct: (ratio: number) => signedPercent.format(ratio),
  roas: (n: number) => `${decimal2.format(n)}x`,
  date: (iso: string) => shortDate.format(new Date(iso)),
  longDate: (iso: string) => longDate.format(new Date(iso)),
  dateTime: (iso: string) => dateTime.format(new Date(iso)),
};

/** Relative change between two values, or 0 when the previous value is 0. */
export function change(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (current - previous) / Math.abs(previous);
}
