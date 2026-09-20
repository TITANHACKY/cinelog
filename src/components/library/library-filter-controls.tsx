"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { LibraryBrowseDialog } from "@/components/library/library-browse-dialog";
import { LibraryBrowseFields } from "@/components/library/library-browse-fields";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useLibraryBrowse } from "@/hooks/library/use-library-browse";
import { DEFAULT_LIBRARY_BROWSE_QUERY, MEDIA_TYPES } from "@/lib/constants";
import { browseQueriesEqual } from "@/lib/media/library-browse";
import type { LibraryBrowseQuery, LibraryMediaType, SmartCollectionWithFilters } from "@/lib/types";
import { useCallback } from "react";

export type { LibraryMediaType };

type LibraryFilterControlsProps = {
  movieCount: number;
  seriesCount: number;
  mediaType: LibraryMediaType;
  onMediaTypeChange?: (mediaType: LibraryMediaType) => void;
  libraryCollections: SmartCollectionWithFilters[];
  selectedCollectionId: number | null;
  onCollectionChange: (collectionId: number | null) => void;
};

function manualBrowseChanged(
  current: LibraryBrowseQuery,
  next: LibraryBrowseQuery,
) {
  return (
    current.filterField !== next.filterField ||
    current.filterOperator !== next.filterOperator ||
    current.filterValue !== next.filterValue ||
    current.sortField !== next.sortField ||
    current.sortDirection !== next.sortDirection ||
    current.groupBy !== next.groupBy
  );
}

export function LibraryFilterControls({
  movieCount,
  seriesCount,
  mediaType,
  onMediaTypeChange,
  libraryCollections,
  selectedCollectionId,
  onCollectionChange,
}: LibraryFilterControlsProps) {
  const counts: Record<LibraryMediaType, number> = {
    movie: movieCount,
    series: seriesCount,
  };
  const browse = useLibraryBrowse(mediaType);
  const presetActive = selectedCollectionId !== null;

  const applyQuery = useCallback(
    (next: LibraryBrowseQuery) => {
      const normalized: LibraryBrowseQuery = {
        ...next,
        q: next.q.trim(),
      };

      if (manualBrowseChanged(browse.query, normalized) && presetActive) {
        onCollectionChange(null);
      }

      if (browseQueriesEqual(browse.query, normalized)) {
        return;
      }

      browse.applyQuery(normalized);
    },
    [browse, onCollectionChange, presetActive],
  );

  const collectionOptions = [
    { value: "", label: "Browse manually" },
    ...libraryCollections.map((col) => ({
      value: String(col.id),
      label: col.name,
    })),
  ];

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        {libraryCollections.length > 0 ? (
          <SearchFilterSelect
            aria-label="Library collection preset"
            heading="Collection"
            menuMinWidth={220}
            onChange={(value) => {
              const id = value ? Number(value) : null;
              onCollectionChange(id);
              if (id) {
                applyQuery({
                  ...DEFAULT_LIBRARY_BROWSE_QUERY,
                  q: browse.query.q,
                });
              }
            }}
            options={collectionOptions}
            placeholder="Browse manually"
            triggerClassName="min-w-[10rem]"
            value={selectedCollectionId ? String(selectedCollectionId) : ""}
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SearchField
          aria-label="Search your library"
          className="min-w-0 flex-1 shadow-none sm:max-w-xs"
          endIcon={<X className="size-3.5" />}
          onClear={() => {
            browse.setDraftQ("");
            applyQuery({ ...browse.query, q: "" });
          }}
          onValueChange={browse.setDraftQ}
          placeholder="Search titles"
          startIcon={<Search className="size-4" />}
          value={browse.draftQ}
        />

        <div className="hidden min-w-0 flex-wrap items-center gap-1 rounded-xl border border-outline-alt bg-surface-container-low p-1 sm:flex">
          <LibraryBrowseFields
            disabled={presetActive}
            mediaType={mediaType}
            onChange={applyQuery}
            query={browse.query}
          />
        </div>

        <Button
          aria-label="Open library filters"
          className="size-9 sm:hidden"
          disabled={presetActive}
          onClick={browse.openDialog}
          size="icon"
          type="button"
          variant={browse.hasActiveBrowse ? "primaryFilled" : "darkFilled"}
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>

      <LibraryBrowseDialog
        disabled={presetActive}
        mediaType={mediaType}
        onApply={() => {
          const normalized = { ...browse.dialogDraft, q: browse.query.q };
          if (manualBrowseChanged(browse.query, normalized) && presetActive) {
            onCollectionChange(null);
          }
          browse.applyQuery(normalized);
          browse.setDialogOpen(false);
        }}
        onChange={browse.setDialogDraft}
        onClear={() => {
          onCollectionChange(null);
          browse.clearBrowse();
        }}
        onOpenChange={browse.setDialogOpen}
        open={browse.dialogOpen}
        query={browse.dialogDraft}
      />
    </div>
  );
}
