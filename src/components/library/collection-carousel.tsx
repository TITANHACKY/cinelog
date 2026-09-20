"use client";

import { useCallback, useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { Carousel } from "@/components/ui/carousel";
import { EmptyState } from "@/components/ui/empty-state";
import { MovieCard } from "@/components/ui/movie-card";
import { SeriesCard } from "@/components/ui/series-card";
import { apiFetch } from "@/lib/http/client";
import type {
  LibraryMovie,
  LibrarySeries,
  SmartCollectionWithFilters,
} from "@/lib/types";

const MINIMUM_COLLECTION_PAGE_SIZE = 15;

type CollectionCarouselProps = {
  collection: SmartCollectionWithFilters;
  initialItems: Array<LibraryMovie | LibrarySeries>;
  initialCount: number;
  initialHasMore: boolean;
  pageSize?: number;
};

export function CollectionCarousel({
  collection,
  initialItems,
  initialCount,
  initialHasMore,
  pageSize = MINIMUM_COLLECTION_PAGE_SIZE,
}: CollectionCarouselProps) {
  const actualPageSize = Math.max(MINIMUM_COLLECTION_PAGE_SIZE, pageSize);
  const [items, setItems] = useState(initialItems);
  const [count, setCount] = useState(initialCount);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleNearEnd = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        offset: String(items.length),
        limit: String(actualPageSize),
      });
      const res = await apiFetch(
        `/api/collections/${collection.id}/items?${params.toString()}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load more items");
      }

      const payload = data.data ?? data;
      const pageItems =
        collection.mediaType === 0 ? payload.movies : payload.series;
      setItems((prev) => [...prev, ...pageItems]);
      setCount(
        collection.mediaType === 0
          ? payload.metadata.count.movies
          : payload.metadata.count.series,
      );
      setHasMore(payload.metadata.hasMore);
    } catch {
      // keep current items visible on load-more failure
    } finally {
      setLoadingMore(false);
    }
  }, [
    actualPageSize,
    collection.id,
    collection.mediaType,
    hasMore,
    items.length,
    loadingMore,
  ]);

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
      onNearEnd={() => void handleNearEnd()}
      showNav={count > 0}
      title={collection.name}
    >
      {count > 0 ? (
        <>
          {items.map((item) => {
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
