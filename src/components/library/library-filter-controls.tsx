"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { LibraryBrowseDialog } from "@/components/library/library-browse-dialog";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tooltip } from "@/components/ui/tooltip";
import { useLibraryBrowse } from "@/hooks/library/use-library-browse";
import { LIBRARY_COLLECTION_ACTIVE_HINT, MEDIA_TYPES } from "@/lib/constants";
import type {
  LibraryMediaType,
  LibraryNavTab,
  SmartCollectionWithFilters,
} from "@/lib/types";

export type { LibraryMediaType, LibraryNavTab };

type LibraryFilterControlsProps = {
  movieCount: number;
  seriesCount: number;
  franchiseCount?: number;
  mediaType: LibraryMediaType;
  onMediaTypeChange?: (mediaType: LibraryMediaType) => void;
  libraryCollections: SmartCollectionWithFilters[];
};

export function LibraryFilterControls({
  movieCount,
  seriesCount,
  franchiseCount,
  mediaType,
  onMediaTypeChange,
  libraryCollections,
}: LibraryFilterControlsProps) {
  const counts: Record<string, number> = {
    movie: movieCount,
    series: seriesCount,
    franchises: franchiseCount ?? 0,
  };
  const browse = useLibraryBrowse(mediaType);
  const presetActive = browse.selectedCollectionId !== null;
  const customFiltersActive = browse.hasCustomFilters;

  const collectionOptions = [
    { value: "", label: "Browse manually" },
    ...libraryCollections.map((col) => ({
      value: String(col.id),
      label: col.name,
    })),
  ];

  const hasCollectionSelect = libraryCollections.length > 0;
  const pairedControlClass = hasCollectionSelect
    ? "flex min-w-0 flex-1 basis-0 lg:flex-none lg:w-auto"
    : "flex min-w-0 w-full lg:w-auto";

  const filtersButton = (
    <Button
      aria-label="Open library filters"
      className="h-9 w-full lg:w-28 px-3.5"
      disabled={presetActive}
      onClick={browse.openDialog}
      type="button"
      variant={browse.hasCustomFilters ? "primaryFilled" : "darkFilled"}
    >
      <SlidersHorizontal className="size-4" />
      <span>Filters</span>
    </Button>
  );

  const filtersControl = (
    <div className={pairedControlClass}>
      {presetActive ? (
        <Tooltip
          align="responsive"
          className="w-full"
          content={LIBRARY_COLLECTION_ACTIVE_HINT}
          contentClassName="w-56 sm:w-64"
          side="top"
          triggerClassName="w-full"
        >
          <span className="inline-flex w-full">{filtersButton}</span>
        </Tooltip>
      ) : (
        filtersButton
      )}
    </div>
  );

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <SegmentedControl<LibraryNavTab>
        aria-label="Filter library by media type"
        className="min-w-0 basis-full lg:basis-auto lg:flex-none"
        onChange={(val) => {
          if (val === "movie" || val === "series") {
            onMediaTypeChange?.(val);
          }
        }}
        options={MEDIA_TYPES.map(({ icon: Icon, label, value, href }) => ({
          value,
          label,
          href,
          icon: <Icon className="size-3.5 shrink-0" />,
          badge: (
            <span
              aria-label={`${counts[value] ?? 0} ${value}`}
              className={`inline-flex h-3.5 min-w-3.5 sm:h-4.5 sm:min-w-4.5 shrink-0 items-center justify-center rounded-md px-1 sm:px-1.5 font-public-sans text-[9px] sm:text-[10px] leading-none font-medium ${
                mediaType === value
                  ? "bg-white/20 text-white"
                  : "bg-surface-container-high text-secondary"
              }`}
            >
              {counts[value] ?? 0}
            </span>
          ),
        }))}
        stretch
        value={mediaType}
      />

      <SearchField
        aria-label="Search your library"
        className="min-w-0 w-full basis-full shadow-none lg:basis-0 lg:flex-1"
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

      <div className="flex min-w-0 basis-full items-center gap-2 lg:basis-auto lg:flex-none">
        {filtersControl}

        {hasCollectionSelect ? (
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
            triggerClassName="h-9 w-full lg:w-44 justify-between gap-1.5 overflow-hidden"
            value={presetActive ? String(browse.selectedCollectionId) : ""}
            wrapperClassName={pairedControlClass}
          />
        ) : null}
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
