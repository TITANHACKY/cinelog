import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { GuidePage } from "@/components/guide/guide-page";

export const metadata: Metadata = {
  title: "CineLog - Guide",
  description:
    "Explore CineLog features, app preview, and tutorials to get the most out of your cinema tracking experience.",
};

export default function Guide() {
  return (
    <AppShell>
      <GuidePage />
    </AppShell>
  );
}
