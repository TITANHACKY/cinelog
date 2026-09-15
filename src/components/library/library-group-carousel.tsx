"use client";

import { useCallback } from "react";
import { Clapperboard, Loader2, TvMinimal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Carousel } from "@/components/ui/carousel";
import { MovieCard } from "@/components/ui/movie-card";
import { SeriesCard } from "@/components/ui/series-card";
import { libraryImpressionGroupLabel } from "@/lib/media/library-browse";
import type {
  LibraryGroup,
  LibraryGroupBy,
  LibraryMediaType,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";

type LibraryGroupCarouselProps = {
  group: LibraryGroup;
  groupBy?: LibraryGroupBy;
  mediaType: LibraryMediaType;
  items: Array<LibraryMovie | LibrarySeries>;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

export function LibraryGroupCarousel({
  group,
  groupBy,
  mediaType,
  items,
  hasMore,
  loadingMore,
  onLoadMore,
}: LibraryGroupCarouselProps) {
  const title =
    groupBy === 1 ? libraryImpressionGroupLabel(group.key) : group.label;
  const handleNearEnd = useCallback(() => {
    if (hasMore && !loadingMore) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  const headingId = `library-group-${mediaType}-${group.key.replace(/\W+/g, "-")}`;

  return (
    <Carousel
      extraHeader={
        <Badge
          className="border-transparent bg-status-info text-white"
          text={String(group.count)}
        />
      }
      headingId={headingId}
      icon={
        mediaType === "movie" ? (
          <Clapperboard className="h-4.5 w-4.5" />
        ) : (
          <TvMinimal className="h-4.5 w-4.5" />
        )
      }
      navAlwaysVisible
      onNearEnd={handleNearEnd}
      showNav
      title={title}
    >
      {items.map((item) => (
        <div className="w-40 shrink-0 sm:w-60" key={item.tmdb_id}>
          {mediaType === "movie" ? (
            <MovieCard movie={item as LibraryMovie} />
          ) : (
            <SeriesCard series={item as LibrarySeries} />
          )}
        </div>
      ))}
      {loadingMore ? (
        <div className="flex w-10 shrink-0 items-center justify-center text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}
    </Carousel>
  );
}
