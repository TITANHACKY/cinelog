"use client";

import { useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { Carousel } from "@/components/ui/carousel";
import { EmptyState } from "@/components/ui/empty-state";
import { MovieCard } from "@/components/ui/movie-card";
import { SeriesCard } from "@/components/ui/series-card";
import { appendUnique } from "@/lib/media/library-items";
import { useGetCollectionCarouselPagesInfiniteQuery } from "@/store/api/library-api";
import type {
  LibraryMovie,
  LibrarySeries,
  SmartCollectionWithFilters,
} from "@/lib/types";

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
}: CollectionCarouselProps) {
  const isMovie = collection.mediaType === 0;
  const [paging, setPaging] = useState(false);
  const query = useGetCollectionCarouselPagesInfiniteQuery(collection.id, {
    skip: !paging,
    initialPageParam: initialItems.length,
  });

  const fetched = (query.data?.pages ?? []).reduce<
    Array<LibraryMovie | LibrarySeries>
  >((all, page) => appendUnique(all, isMovie ? page.movies : page.series), []);
  const items = appendUnique(initialItems, fetched);
  const count = isMovie
    ? (query.data?.pages[0]?.metadata.count.movies ?? initialCount)
    : (query.data?.pages[0]?.metadata.count.series ?? initialCount);
  const hasMore = query.data ? Boolean(query.hasNextPage) : initialHasMore;

  return (
    <Carousel
      extraHeader={
        <>
          <span className="rounded-md border border-outline-variant bg-surface-container-high px-2 py-0.5 font-public-sans text-[10px] font-medium text-secondary">
            {isMovie ? "Movies" : "Series"}
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
      onNearEnd={() => {
        if (!hasMore || query.isFetching) return;
        if (!paging) {
          setPaging(true);
          return;
        }
        void query.fetchNextPage();
      }}
      showNav={count > 0}
      title={collection.name}
    >
      {count > 0 ? (
        <>
          {items.map((item) => {
            const itemIsMovie = "title" in item;
            return (
              <div
                className="w-40 shrink-0 sm:w-60"
                key={`${itemIsMovie ? "movie" : "series"}-${item.tmdb_id}`}
              >
                {itemIsMovie ? (
                  <MovieCard movie={item as LibraryMovie} />
                ) : (
                  <SeriesCard series={item as LibrarySeries} />
                )}
              </div>
            );
          })}
          {query.isFetching ? (
            <div className="flex w-16 shrink-0 items-center justify-center py-8 text-brand-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : null}
        </>
      ) : undefined}
    </Carousel>
  );
}
