import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryView } from "@/components/library/library-view";

export const metadata: Metadata = {
  title: "Movie Library",
  description:
    "View and manage your saved movies, watchlist, and custom movie collections.",
};

export default function LibraryMoviesPage() {
  return (
    <AppShell>
      <LibraryView mediaType="movie" />
    </AppShell>
  );
}
