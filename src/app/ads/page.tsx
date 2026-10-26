import type { Metadata } from "next";
import { AdsView } from "@/views/ads-view";

export const metadata: Metadata = { title: "Paid Ads" };

export default function AdsPage() {
  return <AdsView />;
}
