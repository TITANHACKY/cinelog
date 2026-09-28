import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryView } from "@/components/library/library-view";

export const metadata: Metadata = {
  title: "Series Library",
  description:
    "View and manage your saved TV series, episode tracking, and watchlist.",
};

export default function LibrarySeriesPage() {
  return (
    <AppShell>
      <LibraryView mediaType="series" />
    </AppShell>
  );
}
