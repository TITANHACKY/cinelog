"use client";

import { useState } from "react";
import { SmartCollectionsSection } from "@/components/settings/smart-collections-section";
import { UserProfileSection } from "@/components/settings/user-profile-section";
import { SlidersHorizontal, User } from "lucide-react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"collections" | "profile">(
    "collections",
  );

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] px-3.5 py-6 sm:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 sm:gap-8">
        <header className="space-y-2 border-b border-outline-alt/60 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-on-surface sm:text-4xl">
                System Preferences
              </h1>
              <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
                Configure live stream query pipelines, nested collection
                filters, and account credentials.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("collections")}
              className={`flex items-center gap-2 rounded-lg px-3.5 sm:px-4 py-2 font-public-sans text-xs font-medium transition-colors ${
                activeTab === "collections"
                  ? "bg-brand-primary-container/20 text-brand-primary border border-brand-primary/30"
                  : "text-secondary hover:bg-surface-container hover:text-on-surface border border-transparent"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              Smart Collections
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 rounded-lg px-3.5 sm:px-4 py-2 font-public-sans text-xs font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-brand-primary-container/20 text-brand-primary border border-brand-primary/30"
                  : "text-secondary hover:bg-surface-container hover:text-on-surface border border-transparent"
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              User Profile &amp; Credentials
            </button>
          </div>
        </header>

        <div className="pt-2">
          {activeTab === "collections" ? (
            <SmartCollectionsSection />
          ) : (
            <UserProfileSection />
          )}
        </div>
      </div>
    </main>
  );
}
