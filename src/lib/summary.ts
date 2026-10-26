import { change, fmt } from "./format";

/** Plain-language trend phrase used in chart summaries, e.g. "up 4.2% on the previous period". */
export function trendPhrase(current: number, previous: number): string {
  const delta = change(current, previous);
  if (Math.abs(delta) < 0.0005) return "flat on the previous period";
  return `${delta > 0 ? "up" : "down"} ${fmt.pct(Math.abs(delta))} on the previous period`;
}
