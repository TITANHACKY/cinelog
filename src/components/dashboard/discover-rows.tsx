"use client";

import {
  CalendarClock,
  Clapperboard,
  Languages,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { DiscoverRow } from "@/components/dashboard/discover-row";
import {
  SearchFilterSelect,
  type SearchFilterOption,
} from "@/components/search-popup/search-filter-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useDiscoverRowSelection } from "@/hooks/dashboard/use-discover-row-selection";
import { genreOptionsFor } from "@/lib/discover/selection";
import type {
  DiscoverLayoutReady,
  DiscoverMedia,
  DiscoverRowId,
} from "@/lib/types";

const MEDIA_OPTIONS: Array<{ value: DiscoverMedia; label: string }> = [
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
];

function MediaPill({ media }: { media: DiscoverMedia }) {
  return (
    <span className="rounded-md border border-outline-variant bg-surface-container-high px-2 py-0.5 font-public-sans text-[10px] font-medium text-secondary">
      {media === "movie" ? "Movies" : "Series"}
    </span>
  );
}

type SelectableRowProps = {
  rowId: Exclude<DiscoverRowId, "because">;
  title: string;
  icon: LucideIcon;
  lockedMedia: DiscoverMedia | null;
  select?: {
    label: "Genre" | "Language";
    optionsFor: (media: DiscoverMedia) => SearchFilterOption[];
  };
  keyFor: (media: DiscoverMedia, value: string | null) => string | null;
};

function SelectableRow({
  rowId,
  title,
  icon,
  lockedMedia,
  select,
  keyFor,
}: SelectableRowProps) {
  const selection = useDiscoverRowSelection(rowId, {
    lockedMedia,
    optionsFor: (media) =>
      select?.optionsFor(media).map((option) => option.value) ?? [],
  });

  const controls = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {select ? (
        <SearchFilterSelect
          aria-label={select.label}
          heading={select.label}
          hideHeading
          onChange={selection.setValue}
          options={select.optionsFor(selection.media)}
          placeholder={select.label}
          triggerClassName="min-h-11 sm:min-h-9"
          value={selection.value ?? ""}
        />
      ) : null}
      {lockedMedia ? (
        <MediaPill media={lockedMedia} />
      ) : (
        <SegmentedControl
          aria-label="Media type"
          onChange={selection.setMedia}
          optionClassName="min-h-11 sm:min-h-8"
          options={MEDIA_OPTIONS}
          value={selection.media}
        />
      )}
    </div>
  );

  return (
    <DiscoverRow
      controls={controls}
      icon={icon}
      rowId={rowId}
      rowKey={keyFor(selection.media, selection.value)}
      title={title}
    />
  );
}

export function DiscoverRows({ layout }: { layout: DiscoverLayoutReady }) {
  const lockedMedia: DiscoverMedia | null =
    layout.mediaLean === 0 ? "movie" : layout.mediaLean === 1 ? "series" : null;
  const genreOptions = (media: DiscoverMedia) =>
    genreOptionsFor(layout.genres, media);
  const languageOptions = () =>
    layout.languages.map((language) => ({
      value: language.code,
      label: language.label,
    }));

  return (
    <>
      <SelectableRow
        icon={TrendingUp}
        keyFor={(media) => `trending:${media}`}
        lockedMedia={lockedMedia}
        rowId="trending"
        title="Trending this week"
      />
      <SelectableRow
        icon={CalendarClock}
        keyFor={(media) => `new:${media}`}
        lockedMedia={lockedMedia}
        rowId="new"
        title="Newly released"
      />
      {layout.seed ? (
        <DiscoverRow
          controls={<MediaPill media={layout.seed.mediaType} />}
          icon={Sparkles}
          rowId="because"
          rowKey={`because:${layout.seed.mediaType}:${layout.seed.tmdbId}`}
          title={`Because you watched ${layout.seed.title}`}
        />
      ) : null}
      <SelectableRow
        icon={Clapperboard}
        keyFor={(media, value) => {
          const option = genreOptions(media).find(
            (item) => item.value === value,
          );
          return option ? `top:${media}:${option.genreId}` : null;
        }}
        lockedMedia={lockedMedia}
        rowId="top"
        select={{ label: "Genre", optionsFor: genreOptions }}
        title="Top picks in"
      />
      <SelectableRow
        icon={Languages}
        keyFor={(media, value) => (value ? `lang:${media}:${value}` : null)}
        lockedMedia={lockedMedia}
        rowId="lang"
        select={{ label: "Language", optionsFor: languageOptions }}
        title="Popular in"
      />
    </>
  );
}
