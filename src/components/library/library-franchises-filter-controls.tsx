"use client";

import { Search, X } from "lucide-react";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MEDIA_TYPES } from "@/lib/constants";
import type { FranchiseSortOption } from "@/hooks/library/use-library-franchises";
import type { LibraryNavTab } from "@/lib/types";

export const FRANCHISE_SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A → Z)" },
  { value: "name-desc", label: "Name (Z → A)" },
  { value: "date-desc", label: "Recently Followed" },
  { value: "date-asc", label: "Oldest Followed" },
];

type LibraryFranchisesFilterControlsProps = {
  movieCount: number;
  seriesCount: number;
  franchiseCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  sortOption: FranchiseSortOption;
  onSortChange: (option: FranchiseSortOption) => void;
};

export function LibraryFranchisesFilterControls({
  movieCount,
  seriesCount,
  franchiseCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
  sortOption,
  onSortChange,
}: LibraryFranchisesFilterControlsProps) {
  const counts: Record<string, number> = {
    movie: movieCount,
    series: seriesCount,
    franchises: franchiseCount,
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      {/* Media Type Navigation Switcher */}
      <SegmentedControl<LibraryNavTab>
        aria-label="Filter library by media type"
        className="min-w-0 basis-full lg:basis-auto lg:flex-none"
        options={MEDIA_TYPES.map(({ icon: Icon, label, value, href }) => ({
          value,
          label,
          href,
          icon: <Icon className="size-3.5 shrink-0" />,
          badge: (
            <span
              aria-label={`${counts[value] ?? 0} ${label}`}
              className={`inline-flex h-3.5 min-w-3.5 sm:h-4.5 sm:min-w-4.5 shrink-0 items-center justify-center rounded-md px-1 sm:px-1.5 font-public-sans text-[9px] sm:text-[10px] leading-none font-medium ${
                value === "franchises"
                  ? "bg-white/20 text-white"
                  : "bg-surface-container-high text-secondary"
              }`}
            >
              {counts[value] ?? 0}
            </span>
          ),
        }))}
        stretch
        value="franchises"
      />

      {/* Search Bar */}
      <SearchField
        aria-label="Search followed franchises"
        className="min-w-0 w-full basis-full shadow-none lg:basis-0 lg:flex-1"
        endIcon={<X className="size-3.5" />}
        onClear={onClearSearch}
        onValueChange={onSearchChange}
        placeholder="Search franchises"
        startIcon={<Search className="size-4" />}
        value={searchQuery}
      />

      {/* Sort Select */}
      <div className="flex min-w-0 basis-full items-center gap-2 lg:basis-auto lg:flex-none">
        <SearchFilterSelect
          activeVariant="darkFilled"
          aria-label="Sort franchises"
          heading="Sort"
          hideHeading
          labelClassName="min-w-0 flex-1 truncate text-left"
          onChange={(val) => onSortChange(val as FranchiseSortOption)}
          options={FRANCHISE_SORT_OPTIONS}
          placeholder="Sort by"
          triggerClassName="h-9 w-full lg:w-44 justify-between gap-1.5 overflow-hidden"
          value={sortOption}
          variant="darkFilled"
          wrapperClassName="flex min-w-0 w-full lg:w-auto"
        />
      </div>
    </div>
  );
}
