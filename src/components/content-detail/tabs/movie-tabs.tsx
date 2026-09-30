"use client";

import { useRef, useState } from "react";
import { Info, Layers, Sparkles, Users } from "lucide-react";
import { InfoTab } from "@/components/content-detail/tabs/info-tab";
import { CastCrewTab } from "@/components/content-detail/tabs/cast-crew-tab";
import { RecommendationTab } from "@/components/content-detail/tabs/recommendation-tab";
import { FranchiseCard } from "@/components/content-detail/tabs/franchise-card";
import { useGetFranchiseDetailsQuery } from "@/store/api/franchises-api";
import type { MovieDetails } from "@/lib/types";

type TabKey = "info" | "franchise" | "cast-crew" | "recommendation";

type MovieTabsProps = {
  movie: MovieDetails;
};

export function MovieTabs({ movie }: MovieTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const navRef = useRef<HTMLDivElement>(null);

  const hasFranchise = Boolean(movie.franchise);

  // Preload franchise details immediately when movie data is available
  // so switching to the franchise tab is instant.
  useGetFranchiseDetailsQuery(
    { id: movie.franchise?.id ?? 0 },
    { skip: !movie.franchise?.id },
  );

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

  const handleTabClick = (
    tabKey: TabKey,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    setActiveTab(tabKey);
    const container = navRef.current;
    const button = e.currentTarget;
    if (container && button) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const scrollLeft =
        container.scrollLeft +
        buttonRect.left -
        containerRect.left -
        (containerRect.width - buttonRect.width) / 2;
      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const currentIndex = tabs.findIndex((t) => t.key === currentTab);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    const nextTab = tabs[nextIndex];
    if (nextTab) {
      setActiveTab(nextTab.key);
      const container = navRef.current;
      const targetBtn = container?.querySelector<HTMLButtonElement>(
        `button[data-tab="${nextTab.key}"]`
      );
      targetBtn?.focus();
      if (container && targetBtn) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = targetBtn.getBoundingClientRect();
        const scrollLeft =
          container.scrollLeft +
          buttonRect.left -
          containerRect.left -
          (containerRect.width - buttonRect.width) / 2;
        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div className="m-2.5 sm:m-4 space-y-4 sm:space-y-6">
      {/* Tab Navigation List */}
      <div
        ref={navRef}
        className="no-scrollbar overflow-x-auto overscroll-x-contain"
      >
        <div
          role="tablist"
          aria-label="Movie details sections"
          onKeyDown={handleKeyDown}
          className="flex min-w-full w-max items-center gap-1 sm:gap-2 border-b border-outline-variant px-0.5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.key;

            return (
              <button
                role="tab"
                aria-selected={isActive}
                data-tab={tab.key}
                className={`relative flex shrink-0 whitespace-nowrap items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition select-none ${
                  isActive
                    ? "text-brand-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                key={tab.key}
                onClick={(e) => handleTabClick(tab.key, e)}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" />
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
