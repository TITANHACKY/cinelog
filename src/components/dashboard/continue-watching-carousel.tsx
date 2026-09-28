"use client";

import { PlayCircle } from "lucide-react";
import { Carousel } from "@/components/ui/carousel";
import { MovieCard } from "@/components/ui/movie-card";
import { SeriesCard } from "@/components/ui/series-card";
import type { LibraryMovie, LibrarySeries } from "@/lib/types";

type ContinueWatchingCarouselProps = {
  items: Array<LibraryMovie | LibrarySeries>;
};

export function ContinueWatchingCarousel({
  items,
}: ContinueWatchingCarouselProps) {
  const count = items.length;

  return (
    <Carousel
      empty={
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center sm:p-8">
          <p className="font-heading text-sm font-semibold text-on-surface sm:text-base">
            No titles in progress
          </p>
          <p className="mt-1 max-w-md font-public-sans text-xs text-secondary sm:text-sm">
            When you mark a movie or series as &ldquo;Watching&rdquo;, it will
            show up here so you can easily pick up where you left off.
          </p>
        </div>
      }
      extraHeader={
        count > 0 ? (
          <span className="font-public-sans text-xs text-outline-muted">
            {count} {count === 1 ? "title" : "titles"}
          </span>
        ) : null
      }
      headingId="continue-watching-heading"
      icon={<PlayCircle className="h-4.5 w-4.5" />}
      navAlwaysVisible
      showNav={count > 0}
      title="Continue Watching"
    >
      {count > 0
        ? items.map((item) => {
            const isMovie = "title" in item;
            return (
              <div
                className="w-40 shrink-0 sm:w-60"
                key={`${isMovie ? "movie" : "series"}-${item.tmdb_id}`}
              >
                {isMovie ? (
                  <MovieCard
                    actionsPosition="below"
                    movie={item as LibraryMovie}
                  />
                ) : (
                  <SeriesCard series={item as LibrarySeries} />
                )}
              </div>
            );
          })
        : null}
    </Carousel>
  );
}
