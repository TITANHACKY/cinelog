"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { LibraryBrowseDialog } from "@/components/library/library-browse-dialog";
import { LibraryBrowseFields } from "@/components/library/library-browse-fields";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useLibraryBrowse } from "@/hooks/library/use-library-browse";
import { MEDIA_TYPES } from "@/lib/constants";
import type { LibraryMediaType } from "@/lib/types";

export type { LibraryMediaType };

type LibraryFilterControlsProps = {
  movieCount: number;
  seriesCount: number;
  mediaType: LibraryMediaType;
  onMediaTypeChange?: (mediaType: LibraryMediaType) => void;
};

export function LibraryFilterControls({
  movieCount,
  seriesCount,
  mediaType,
  onMediaTypeChange,
}: LibraryFilterControlsProps) {
  const counts: Record<LibraryMediaType, number> = {
    movie: movieCount,
    series: seriesCount,
  };
  const browse = useLibraryBrowse(mediaType);

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

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SearchField
          aria-label="Search your library"
          className="min-w-0 flex-1 shadow-none sm:max-w-xs"
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

        <div className="hidden min-w-0 flex-wrap items-center gap-1 rounded-xl border border-outline-alt bg-surface-container-low p-1 sm:flex">
          <LibraryBrowseFields
            mediaType={mediaType}
            onChange={browse.applyQuery}
            query={browse.query}
          />
        </div>

        <Button
          aria-label="Open library filters"
          className="size-9 sm:hidden"
          onClick={browse.openDialog}
          size="icon"
          type="button"
          variant={browse.hasActiveBrowse ? "primaryFilled" : "darkFilled"}
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>

      <LibraryBrowseDialog
        mediaType={mediaType}
        onApply={browse.applyDialog}
        onChange={browse.setDialogDraft}
        onClear={browse.clearBrowse}
        onOpenChange={browse.setDialogOpen}
        open={browse.dialogOpen}
        query={browse.dialogDraft}
      />
    </div>
  );
}
