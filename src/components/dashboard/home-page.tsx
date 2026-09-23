"use client";

import { AlertBanner } from "@/components/ui/alert-banner";
import { ButtonLink } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { CollectionCarousel } from "@/components/library/collection-carousel";
import { useDashboard } from "@/hooks/dashboard/use-dashboard";
import { useAppSelector } from "@/store";
import { BookOpen, Film, Search, Sparkles, Tv } from "lucide-react";

export function HomePage() {
  const { user } = useAppSelector((state) => state.auth);
  const displayName = user?.displayName || user?.username;

  const { isLoading, errorMessage, movieCount, seriesCount, collections } =
    useDashboard();

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] px-3.5 pt-5 pb-8 sm:px-8 sm:pt-6 lg:pt-8 lg:pb-10">
      <div
        aria-hidden={isLoading}
        className={`mx-auto flex w-full max-w-[1720px] flex-col gap-6 sm:gap-8 ${
          isLoading ? "blur-sm" : ""
        }`}
      >
        <header className="relative overflow-hidden rounded-2xl border border-outline-variant bg-linear-to-r from-surface-container-low via-surface-container to-surface-container-low px-4 py-4 sm:px-8 sm:py-6">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-brand-primary-container/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary-container/10 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
                <Sparkles className="h-3 w-3" />
                <span>Ready for your next adventure?</span>
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface sm:text-3xl md:text-4xl">
                  {displayName ? `Welcome ${displayName}!` : "Welcome"}
                </h1>
                <p className="mt-1 max-w-xl font-public-sans text-xs text-secondary sm:mt-2 sm:text-sm">
                  Track your movies and series, and browse smart collection
                  carousels from your watchlist.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:gap-3 sm:self-auto">
              <div className="flex items-center gap-2 rounded-lg bg-surface-container-high px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Film className="h-3.5 w-3.5 shrink-0 text-brand-primary sm:h-4 sm:w-4" />
                <span className="font-public-sans text-xs text-on-surface">
                  {isLoading ? "..." : `${movieCount} Movies`}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-surface-container-high px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Tv className="h-3.5 w-3.5 shrink-0 text-brand-tertiary sm:h-4 sm:w-4" />
                <span className="font-public-sans text-xs text-on-surface">
                  {isLoading ? "..." : `${seriesCount} Series`}
                </span>
              </div>
            </div>
          </div>
        </header>

        {errorMessage ? (
          <AlertBanner message={errorMessage} variant="error" />
        ) : null}

        {!isLoading && collections.length > 0 ? (
          <div className="flex flex-col gap-8 sm:gap-10">
            {collections.map((col) => {
              const items =
                col.mediaType === 0
                  ? col.preview.movies
                  : col.preview.series;
              const count =
                col.mediaType === 0
                  ? col.preview.metadata.count.movies
                  : col.preview.metadata.count.series;

              return (
                <CollectionCarousel
                  collection={col}
                  initialCount={count}
                  initialHasMore={col.preview.metadata.hasMore}
                  initialItems={items}
                  key={col.id}
                />
              );
            })}
          </div>
        ) : !isLoading ? (
          <section className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center sm:gap-4 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary-container/20 text-brand-primary sm:h-11 sm:w-11">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-semibold text-on-surface sm:text-base">
              Start Tracking Titles
            </h3>
            <p className="max-w-md font-public-sans text-xs text-secondary sm:text-sm">
              Click the search button in the bottom right corner to find movies
              and series and add them to your watchlist.
            </p>
            <ButtonLink
              className="text-xs"
              href="/guide"
              variant="darkTonal"
            >
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              New here? Read the guide
            </ButtonLink>
          </section>
        ) : null}
      </div>
      {isLoading ? <LoadingOverlay /> : null}
    </main>
  );
}
