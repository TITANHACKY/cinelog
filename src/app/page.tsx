import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { HomePage } from "@/components/dashboard/home-page";
import { AppShell } from "@/components/layout/app-shell";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "CineLog — Your Personal Movie Log",
  description:
    "Track movies & TV series, build custom watchlists, rate what you love, and relive your cinema journey. Free, beautiful, and built for movie lovers.",
};

export default async function Home() {
  const session = await getSession();

  if (session) {
    return (
      <AppShell>
        <HomePage />
      </AppShell>
    );
  }

  return <LandingPage />;
}
