"use client";

import { useMemo } from "react";
import { AlertCircle, Clapperboard, TvMinimal } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { MovieCard } from "@/components/ui/movie-card";
import { SeriesCard } from "@/components/ui/series-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LibraryFilterControls } from "@/components/library/library-filter-controls";
import { LibraryGroupCarousel } from "@/components/library/library-group-carousel";
import { LibrarySection } from "@/components/library/library-section";
import { useLibraryBrowseSession } from "@/hooks/library/use-library-browse-session";
import { useLibraryCollection } from "@/hooks/library/use-library-collection";
import { useLibraryList } from "@/hooks/library/use-library-list";
import {
  LIBRARY_DESCRIPTION,
  LIBRARY_EMPTY_DESCRIPTION,
  LIBRARY_EMPTY_TITLE,
  LIBRARY_ERROR_DESCRIPTION,
  LIBRARY_ERROR_TITLE,
} from "@/lib/constants";
import type {
  LibraryGroupBy,
  LibraryMediaType,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";
import { useGetCollectionsQuery } from "@/store/api/collections-api";
import { useAppSelector } from "@/store";

type LibraryViewProps = {
  mediaType?: LibraryMediaType;
};

export function LibraryView({ mediaType = "movie" }: LibraryViewProps) {
  useLibraryBrowseSession();
  const { queries, selectedCollectionIds } = useAppSelector(
    (state) => state.library,
  );
  const user = useAppSelector((state) => state.auth.user);
  const smartCollectionsEnabled = Boolean(user?.smartCollectionsEnabled);

  const query = queries[mediaType];
  const selectedCollectionId = selectedCollectionIds[mediaType];

  const collectionsQuery = useGetCollectionsQuery();
  const collections = useMemo(
    () => collectionsQuery.data?.collections ?? [],
    [collectionsQuery.data],
  );

  const validSelectedCollectionId = useMemo(() => {
    if (!smartCollectionsEnabled || !selectedCollectionId) return null;
    const selected = collections.find((col) => col.id === selectedCollectionId);
    if (
      !selected ||
      !selected.showInLibrary ||
      selected.mediaType !== (mediaType === "movie" ? 0 : 1)
    ) {
      return null;
    }
    return selectedCollectionId;
  }, [collections, mediaType, selectedCollectionId, smartCollectionsEnabled]);

  const manual = useLibraryList(
    mediaType,
    query,
    validSelectedCollectionId === null,
  );
  const preset = useLibraryCollection(validSelectedCollectionId, query.q);

  const libraryCollections = useMemo(
    () =>
      !smartCollectionsEnabled
        ? []
        : collections.filter(
            (col) =>
              col.showInLibrary &&
              col.mediaType === (mediaType === "movie" ? 0 : 1),
          ),
    [collections, mediaType, smartCollectionsEnabled],
  );

  const isMovies = mediaType === "movie";
  const manualData = manual.data;
  const presetData = preset.data;
  const active = validSelectedCollectionId !== null ? presetData : manualData;
  const isLoading =
    validSelectedCollectionId !== null ? preset.isLoading : manual.isLoading;
  const currentCount = active
    ? isMovies
      ? active.movieCount
      : active.seriesCount
    : 0;
  const emptyIcon = isMovies ? (
    <Clapperboard className="h-6 w-6" />
  ) : (
    <TvMinimal className="h-6 w-6" />
  );
  const isManualGrouped =
    validSelectedCollectionId === null &&
    Boolean(manualData) &&
    query.groupBy !== undefined &&
    Boolean(manualData?.groups?.length);
  const tabMovieCount =
    validSelectedCollectionId !== null &&
    presetData?.collection?.mediaType === 0
      ? presetData.movieCount
      : (active?.movieCount ?? 0);
  const tabSeriesCount =
    validSelectedCollectionId !== null &&
    presetData?.collection?.mediaType === 1
      ? presetData.seriesCount
      : (active?.seriesCount ?? 0);

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] px-3.5 py-6 sm:px-6 lg:py-8">
      <div
        aria-hidden={isLoading}
        className={`mx-auto flex w-full max-w-[1720px] min-w-0 flex-col gap-6 sm:gap-8 ${
          isLoading ? "blur-sm" : ""
        }`}
      >
        <header className="space-y-2 border-b border-outline-alt pb-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-on-surface sm:text-4xl">
              My library
            </h1>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:text-sm">
              {LIBRARY_DESCRIPTION}
            </p>
          </div>
        </header>

        <LibraryFilterControls
          libraryCollections={libraryCollections}
          mediaType={mediaType}
          movieCount={tabMovieCount}
          seriesCount={tabSeriesCount}
        />

        {preset.error ? (
          <EmptyState
            description={preset.error}
            icon={<AlertCircle className="h-6 w-6 text-status-error" />}
            title="Collection unavailable"
            titleClassName="text-status-error"
          />
        ) : manual.isError &&
          !manualData &&
          validSelectedCollectionId === null ? (
          <EmptyState
            description={LIBRARY_ERROR_DESCRIPTION}
            icon={<AlertCircle className="h-6 w-6 text-status-error" />}
            title={LIBRARY_ERROR_TITLE}
            titleClassName="text-status-error"
          />
        ) : isLoading ? null : validSelectedCollectionId &&
          presetData?.collection ? (
          presetData.groupBy !== null && presetData.groups?.length ? (
            presetData.groups.map((group) => {
              const page = presetData.groupPages[group.key];
              return (
                <LibraryGroupCarousel
                  group={group}
                  groupBy={presetData.groupBy as LibraryGroupBy}
                  hasMore={page?.hasMore ?? Boolean(group.hasMore)}
                  items={page?.items ?? []}
                  key={group.key}
                  loadingMore={page?.loadingMore ?? false}
                  mediaType={mediaType}
                  onLoadMore={() => void preset.loadMoreGroup(group.key)}
                />
              );
            })
          ) : currentCount === 0 ? (
            <EmptyState
              description={LIBRARY_EMPTY_DESCRIPTION}
              icon={emptyIcon}
              title={LIBRARY_EMPTY_TITLE}
            />
          ) : (
            <LibrarySection
              count={currentCount}
              emptyIcon={emptyIcon}
              hasMore={presetData.hasMore}
              loadingMore={preset.loadingMore}
              onLoadMore={() => void preset.loadMore()}
              title={presetData.collection.name}
            >
              {isMovies
                ? presetData.items.map((movie) => (
                    <MovieCard
                      key={movie.tmdb_id}
                      movie={movie as LibraryMovie}
                    />
                  ))
                : presetData.items.map((show) => (
                    <SeriesCard
                      key={show.tmdb_id}
                      series={show as LibrarySeries}
                    />
                  ))}
            </LibrarySection>
          )
        ) : !manualData ? null : currentCount === 0 ? (
          <EmptyState
            description={LIBRARY_EMPTY_DESCRIPTION}
            icon={emptyIcon}
            title={LIBRARY_EMPTY_TITLE}
          />
        ) : isManualGrouped && manualData.groups ? (
          manualData.groups.map((group) => {
            const page = manualData.groupPages[group.key];
            return (
              <LibraryGroupCarousel
                group={group}
                groupBy={query.groupBy}
                hasMore={page?.hasMore ?? Boolean(group.hasMore)}
                items={page?.items ?? []}
                key={group.key}
                loadingMore={page?.loadingMore ?? false}
                mediaType={mediaType}
                onLoadMore={() => void manual.loadMoreGroup(group.key)}
              />
            );
          })
        ) : (
          <LibrarySection
            count={currentCount}
            emptyIcon={emptyIcon}
            hasMore={manualData.hasMore}
            loadingMore={manual.loadingMore}
            onLoadMore={() => void manual.loadMore()}
            title={isMovies ? "Movies" : "Series"}
          >
            {isMovies
              ? manualData.items.map((movie) => (
                  <MovieCard
                    key={movie.tmdb_id}
                    movie={movie as LibraryMovie}
                  />
                ))
              : manualData.items.map((show) => (
                  <SeriesCard
                    key={show.tmdb_id}
                    series={show as LibrarySeries}
                  />
                ))}
          </LibrarySection>
        )}
      </div>
      {isLoading && <LoadingOverlay />}
    </main>
  );
}
