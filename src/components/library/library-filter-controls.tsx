"use client";

import { useRef, useState } from "react";
import { Info, Search, SlidersHorizontal, X } from "lucide-react";
import { LibraryBrowseDialog } from "@/components/library/library-browse-dialog";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tooltip } from "@/components/ui/tooltip";
import { useLibraryBrowse } from "@/hooks/library/use-library-browse";
import {
  LIBRARY_COLLECTION_ACTIVE_HINT,
  LIBRARY_CUSTOM_FILTERS_ACTIVE_HINT,
  MEDIA_TYPES,
} from "@/lib/constants";
import type { LibraryMediaType, SmartCollectionWithFilters } from "@/lib/types";

export type { LibraryMediaType };

type LibraryFilterControlsProps = {
  movieCount: number;
  seriesCount: number;
  mediaType: LibraryMediaType;
  onMediaTypeChange?: (mediaType: LibraryMediaType) => void;
  libraryCollections: SmartCollectionWithFilters[];
};

export function LibraryFilterControls({
  movieCount,
  seriesCount,
  mediaType,
  onMediaTypeChange,
  libraryCollections,
}: LibraryFilterControlsProps) {
  const counts: Record<LibraryMediaType, number> = {
    movie: movieCount,
    series: seriesCount,
  };
  const browse = useLibraryBrowse(mediaType);
  const presetActive = browse.selectedCollectionId !== null;
  const customFiltersActive = browse.hasCustomFilters;
  const collectionLocked = presetActive || customFiltersActive;
  const [collectionTooltipOpen, setCollectionTooltipOpen] = useState(false);
  const collectionTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleCollectionTooltipChange(open: boolean) {
    if (collectionTooltipTimeoutRef.current) {
      clearTimeout(collectionTooltipTimeoutRef.current);
      collectionTooltipTimeoutRef.current = null;
    }

    if (open) {
      collectionTooltipTimeoutRef.current = setTimeout(() => {
        setCollectionTooltipOpen(true);
        collectionTooltipTimeoutRef.current = null;
      }, 0);
      return;
    }

    setCollectionTooltipOpen(false);
  }

  const collectionOptions = [
    { value: "", label: "Browse manually" },
    ...libraryCollections.map((col) => ({
      value: String(col.id),
      label: col.name,
    })),
  ];

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <SegmentedControl
        aria-label="Filter library by media type"
        onChange={onMediaTypeChange}
        options={MEDIA_TYPES.map(({ icon: Icon, label, value, href }) => ({
          value,
          label,
          href,
          icon: <Icon className="size-3.5 shrink-0" />,
          badge: (
            <span
              aria-label={`${counts[value]} ${value === "movie" ? "movies" : "series"}`}
              className={`inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-md px-1.5 font-public-sans text-[10px] leading-none font-medium ${
                mediaType === value
                  ? "bg-white/25 text-white"
                  : "bg-surface-container text-secondary"
              }`}
            >
              {counts[value]}
            </span>
          ),
        }))}
        value={mediaType}
      />

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField
          aria-label="Search your library"
          className="min-w-0 w-full shadow-none sm:max-w-xs sm:flex-1"
          endIcon={<X className="size-3.5" />}
          onClear={() => {
            browse.setDraftQ("");
            browse.applyQuery({ ...browse.query, q: "" });
          }}
          onValueChange={browse.setDraftQ}
          placeholder="Search titles"
          startIcon={<Search className="size-4" />}
          value={browse.draftQ}
        />

        <div className="flex min-w-0 w-full items-center gap-2 sm:w-auto">
          <Button
            aria-label="Open library filters"
            className="h-9 shrink-0 px-3.5"
            disabled={presetActive}
            onClick={browse.openDialog}
            type="button"
            variant={browse.hasActiveBrowse ? "primaryFilled" : "darkFilled"}
          >
            <SlidersHorizontal className="size-4" />
            <span>Filters</span>
          </Button>

          {libraryCollections.length > 0 ? (
            <div className="flex min-w-0 flex-1 items-center gap-1">
              {collectionLocked ? (
                <Tooltip
                  align="responsive"
                  content={
                    presetActive
                      ? LIBRARY_COLLECTION_ACTIVE_HINT
                      : LIBRARY_CUSTOM_FILTERS_ACTIVE_HINT
                  }
                  contentClassName="w-56 sm:w-64"
                  isOpen={collectionTooltipOpen}
                  onOpenChange={handleCollectionTooltipChange}
                  side="top"
                >
                  <button
                    aria-label="Smart collection filter info"
                    className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
                    onClick={(event) => {
                      event.preventDefault();
                      handleCollectionTooltipChange(!collectionTooltipOpen);
                    }}
                    type="button"
                  >
                    <Info className="size-4" />
                  </button>
                </Tooltip>
              ) : null}
              <SearchFilterSelect
                aria-label="Library collection preset"
                disabled={customFiltersActive}
                heading="Collection"
                hideHeading
                labelClassName="min-w-0 flex-1 truncate text-left"
                menuMinWidth={220}
                onChange={(value) =>
                  browse.selectCollection(value ? Number(value) : null)
                }
                options={collectionOptions}
                placeholder="Browse manually"
                triggerClassName="h-9 min-w-0 w-full max-w-none justify-between gap-1.5 overflow-hidden"
                value={
                  presetActive ? String(browse.selectedCollectionId) : ""
                }
                wrapperClassName="min-w-0 flex-1"
              />
            </div>
          ) : null}
        </div>
      </div>

      <LibraryBrowseDialog
        disabled={presetActive}
        mediaType={mediaType}
        onApply={browse.applyDialog}
        onChange={browse.setDialogDraft}
        onClear={browse.clearDialogFilters}
        onOpenChange={browse.setDialogOpen}
        open={browse.dialogOpen}
        query={browse.dialogDraft}
      />
    </div>
  );
}
