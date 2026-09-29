"use client";

import { useState } from "react";
import { Info, Layers, Sparkles, Users } from "lucide-react";
import { InfoTab } from "@/components/content-detail/tabs/info-tab";
import { CastCrewTab } from "@/components/content-detail/tabs/cast-crew-tab";
import { RecommendationTab } from "@/components/content-detail/tabs/recommendation-tab";
import { FranchiseCard } from "@/components/content-detail/tabs/franchise-card";
import type { MovieDetails } from "@/lib/types";

type TabKey = "info" | "franchise" | "cast-crew" | "recommendation";

type MovieTabsProps = {
  movie: MovieDetails;
};

export function MovieTabs({ movie }: MovieTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  const hasFranchise = Boolean(movie.franchise);

  const tabs: { key: TabKey; label: string; icon: typeof Info }[] = [
    { key: "info", label: "Info", icon: Info },
    ...(hasFranchise
      ? [{ key: "franchise" as const, label: "Franchise", icon: Layers }]
      : []),
    { key: "cast-crew", label: "Cast & Crew", icon: Users },
    { key: "recommendation", label: "Recommendation", icon: Sparkles },
  ];

  const currentTab =
    activeTab === "franchise" && !hasFranchise ? "info" : activeTab;

  return (
    <div className="m-2.5 sm:m-4 space-y-4 sm:space-y-6">
      {/* Tab Navigation List */}
      <div className="flex border-b border-outline-variant">
        <div className="flex items-center gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.key;

            return (
              <button
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition ${
                  isActive
                    ? "text-brand-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>

                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panes */}
      <div>
        {currentTab === "info" && <InfoTab movie={movie} />}
        {currentTab === "franchise" && movie.franchise && (
          <FranchiseCard
            currentMovieId={movie.id}
            franchise={movie.franchise}
          />
        )}
        {currentTab === "cast-crew" && (
          <CastCrewTab
            allCast={movie.all_cast}
            departments={movie.departments}
          />
        )}
        {currentTab === "recommendation" && <RecommendationTab />}
      </div>
    </div>
  );
}

export default MovieTabs;
