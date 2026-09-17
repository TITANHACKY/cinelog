"use client";

import { useCallback, useMemo, useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { Carousel } from "@/components/ui/carousel";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterQueryChips } from "@/components/ui/filter-query-chips";
import { MovieCard } from "@/components/ui/movie-card";
import { SeriesCard } from "@/components/ui/series-card";
import type {
  CustomCollectionWithFilters,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";
import { filterCollectionItems } from "@/lib/media/collection-filter";

const MINIMUM_COLLECTION_PAGE_SIZE = 15;

export function CollectionCarousel({
  collection,
  movies,
  series,
  pageSize = MINIMUM_COLLECTION_PAGE_SIZE,
}: {
  collection: CustomCollectionWithFilters;
  movies: LibraryMovie[];
  series: LibrarySeries[];
  pageSize?: number;
}) {
  const actualPageSize = Math.max(MINIMUM_COLLECTION_PAGE_SIZE, pageSize);
  const matchingItems = useMemo(
    () => filterCollectionItems(collection, movies, series),
    [collection, movies, series],
  );
  const count = matchingItems.length;

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const visibleCount = page * actualPageSize;
  const hasMore = visibleCount < count;
  const visibleItems = useMemo(
    () => matchingItems.slice(0, visibleCount),
    [matchingItems, visibleCount],
  );

  const handleNearEnd = useCallback(() => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      window.setTimeout(() => {
        setPage((prev) => prev + 1);
        setLoadingMore(false);
      }, 180);
    }
  }, [hasMore, loadingMore]);

  return (
    <Carousel
      extraHeader={
        <>
          <span className="rounded-md border border-outline-variant bg-surface-container-high px-2 py-0.5 font-public-sans text-[10px] font-medium text-secondary">
            {collection.mediaType === 0 ? "Movies" : "Series"}
          </span>
          <span className="font-public-sans text-xs text-outline-muted">
            {count} {count === 1 ? "title" : "titles"}
          </span>
        </>
      }
      empty={
        <EmptyState description="No titles in your library match this filter group yet." />
      }
      headingId={`collection-${collection.id}-heading`}
      icon={<Layers className="h-4.5 w-4.5" />}
      navAlwaysVisible
      onNearEnd={handleNearEnd}
      showNav={count > 0}
      subtitle={<FilterQueryChips filters={collection.filters} />}
      title={collection.name}
    >
      {count > 0 ? (
        <>
          {visibleItems.map((item) => {
            const isMovie = "title" in item;
            return (
              <div
                className="w-40 shrink-0 sm:w-60"
                key={`${isMovie ? "movie" : "series"}-${item.tmdb_id}`}
              >
                {isMovie ? (
                  <MovieCard movie={item as LibraryMovie} />
                ) : (
                  <SeriesCard series={item as LibrarySeries} />
                )}
              </div>
            );
          })}
          {loadingMore ? (
            <div className="flex w-16 shrink-0 items-center justify-center py-8 text-brand-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : null}
        </>
      ) : undefined}
    </Carousel>
  );
}
