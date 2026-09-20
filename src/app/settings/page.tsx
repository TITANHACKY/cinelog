import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, application theme, and smart collections.",
};

export default function SettingsRoutePage() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}
