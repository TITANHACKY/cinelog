import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryFranchisesView } from "@/components/library/library-franchises-view";

export const metadata: Metadata = {
  title: "Followed Franchises | CineLog",
  description:
    "View and manage your followed movie franchises and collections.",
};

export default function LibraryFranchisesPage() {
  return (
    <AppShell>
      <LibraryFranchisesView />
    </AppShell>
  );
}
