"use client";

import { Check, ChevronDown } from "lucide-react";
import type { SeasonOption } from "@/hooks/title-details/use-progress-seasons";
import { usePopover } from "@/hooks/use-popover";
import { cn } from "@/lib/utils";

type SeasonSelectProps = {
  disabled?: boolean;
  onSelect: (seasonNumber: number) => void;
  seasons: SeasonOption[];
  selectedSeason?: number;
};

export function SeasonSelect({
  disabled = false,
  onSelect,
  seasons,
  selectedSeason,
}: SeasonSelectProps) {
  const isDisabled = disabled || seasons.length === 0;
  const { isOpen, containerRef, toggle, close } = usePopover(isDisabled);
  const current = seasons.find(
    (season) => season.seasonNumber === selectedSeason,
  );

  return (
    <div className="relative inline-block shrink-0" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest disabled:pointer-events-none disabled:opacity-50"
        disabled={isDisabled}
        onClick={toggle}
        type="button"
      >
        <span>Season {current?.seasonNumber ?? "—"}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 text-outline-muted transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute top-full left-0 z-50 mt-2 max-h-72 w-full min-w-48 overflow-hidden rounded-xl border border-outline-alt bg-surface-container shadow-[0_8px_24px_rgb(0_0_0/25%)]"
          role="listbox"
        >
          <div className="movie-lists-scrollbar flex max-h-72 flex-col overflow-y-auto py-1.5">
            {seasons.map((season) => {
              const isSelected = season.seasonNumber === selectedSeason;
              return (
                <button
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full items-center justify-between gap-1.5 px-2.5 py-2 text-left text-on-surface transition-colors hover:bg-surface-container-high",
                    isSelected && "bg-surface-container-high",
                  )}
                  key={season.id}
                  onClick={() => {
                    close();
                    if (!isSelected) {
                      onSelect(season.seasonNumber);
                    }
                  }}
                  role="option"
                  type="button"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-medium">
                      {season.label}
                    </span>
                    <span className="truncate text-[11px] text-outline-muted">
                      {season.episodesWatched}/{season.episodesAired} watched ·{" "}
                      {season.episodesAired}/{season.episodeCount} released
                    </span>
                  </div>
                  {isSelected ? (
                    <Check
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-brand-primary"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SeasonSelect;
