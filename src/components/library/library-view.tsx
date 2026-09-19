"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clapperboard, TvMinimal } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { MovieCard } from "@/components/ui/movie-card";
import { SeriesCard } from "@/components/ui/series-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LibraryFilterControls } from "@/components/library/library-filter-controls";
import { LibraryGroupCarousel } from "@/components/library/library-group-carousel";
import { LibrarySection } from "@/components/library/library-section";
import { useLibraryCollectionPreset } from "@/hooks/library/use-library-collection-preset";
import {
  LIBRARY_EMPTY_DESCRIPTION,
  LIBRARY_EMPTY_TITLE,
  LIBRARY_ERROR_DESCRIPTION,
  LIBRARY_ERROR_TITLE,
} from "@/lib/constants";
import type {
  CustomCollectionWithFilters,
  LibraryGroupBy,
  LibraryMediaType,
} from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  libraryCollectionSelected,
  libraryGroupPageRequested,
  libraryPageRequested,
  libraryRequested,
} from "@/store/slices/librarySlice";

type LibraryViewProps = {
  mediaType?: LibraryMediaType;
};

export function LibraryView({ mediaType = "movie" }: LibraryViewProps) {
  const dispatch = useAppDispatch();
  const {
    movies,
    series,
    movieCount,
    seriesCount,
    moviesHasMore,
    seriesHasMore,
    moviesLoaded,
    seriesLoaded,
    moviesLoadingMore,
    seriesLoadingMore,
    movieGroups,
    seriesGroups,
    movieGroupPages,
    seriesGroupPages,
    query,
    selectedCollectionId,
    status,
  } = useAppSelector((state) => state.library);

  const [collections, setCollections] = useState<CustomCollectionWithFilters[]>(
    [],
  );

  const validSelectedCollectionId = useMemo(() => {
    if (!selectedCollectionId) return null;
    const selected = collections.find((col) => col.id === selectedCollectionId);
    if (
      !selected ||
      !selected.showInLibrary ||
      selected.mediaType !== (mediaType === "movie" ? 0 : 1)
    ) {
      return null;
    }
    return selectedCollectionId;
  }, [collections, mediaType, selectedCollectionId]);

  const preset = useLibraryCollectionPreset(validSelectedCollectionId, query.q);

  const libraryCollections = useMemo(
    () =>
      collections.filter(
        (col) =>
          col.showInLibrary &&
          col.mediaType === (mediaType === "movie" ? 0 : 1),
      ),
    [collections, mediaType],
  );

  useEffect(() => {
    let ignore = false;
    async function loadCols() {
      try {
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setCollections(data.collections ?? data.data?.collections ?? []);
          }
        }
      } catch {
        // silent ignore
      }
    }
    void loadCols();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    dispatch(libraryRequested({ type: mediaType }));
  }, [dispatch, mediaType]);

  const isMovies = mediaType === "movie";
  const isLoaded = isMovies ? moviesLoaded : seriesLoaded;
  const isLoading =
    validSelectedCollectionId !== null
      ? preset.isLoading
      : !isLoaded && status !== "failed";
  const currentCount = isMovies ? movieCount : seriesCount;
  const hasMore = isMovies ? moviesHasMore : seriesHasMore;
  const loadingMore = isMovies ? moviesLoadingMore : seriesLoadingMore;
  const emptyIcon = isMovies ? (
    <Clapperboard className="h-6 w-6" />
  ) : (
    <TvMinimal className="h-6 w-6" />
  );
  const groups = isMovies ? movieGroups : seriesGroups;
  const groupPages = isMovies ? movieGroupPages : seriesGroupPages;
  const isManualGrouped =
    validSelectedCollectionId === null &&
    isLoaded &&
    query.groupBy !== undefined &&
    Boolean(groups?.length);
  const hasActiveBrowse =
    validSelectedCollectionId !== null ||
    Boolean(query.q.trim()) ||
    Boolean(query.filterField) ||
    query.groupBy !== undefined;
  const headerTotal =
    validSelectedCollectionId !== null
      ? preset.count
      : hasActiveBrowse
        ? currentCount
        : movieCount + seriesCount;

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] px-3.5 py-6 sm:px-8 lg:py-10">
      <div
        aria-hidden={isLoading}
        className={`mx-auto flex w-full min-w-0 flex-col gap-6 sm:gap-8 ${
          isLoading ? "blur-sm" : ""
        }`}
      >
        <header className="flex flex-col gap-4 sm:gap-5">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-on-surface sm:text-4xl">
              My library
            </h1>
            <p className="mt-1 font-public-sans text-xs text-secondary sm:mt-2">
              {isLoading
                ? "Loading your watchlist"
                : validSelectedCollectionId && preset.collection
                  ? `${headerTotal} in ${preset.collection.name}`
                  : hasActiveBrowse
                    ? `${headerTotal} matching ${headerTotal === 1 ? "title" : "titles"}`
                    : `${headerTotal} titles in your watchlist`}
            </p>
          </div>

          <LibraryFilterControls
            libraryCollections={libraryCollections}
            mediaType={mediaType}
            movieCount={movieCount}
            onCollectionChange={(id) => dispatch(libraryCollectionSelected(id))}
            selectedCollectionId={validSelectedCollectionId}
            seriesCount={seriesCount}
          />
        </header>

        {preset.error ? (
          <EmptyState
            description={preset.error}
            icon={<AlertCircle className="h-6 w-6 text-status-error" />}
            title="Collection unavailable"
            titleClassName="text-status-error"
          />
        ) : status === "failed" && !isLoaded && validSelectedCollectionId === null ? (
          <EmptyState
            description={LIBRARY_ERROR_DESCRIPTION}
            icon={<AlertCircle className="h-6 w-6 text-status-error" />}
            title={LIBRARY_ERROR_TITLE}
            titleClassName="text-status-error"
          />
        ) : isLoading ? null : validSelectedCollectionId && preset.collection ? (
          preset.isGrouped && preset.groups?.length ? (
            preset.groups.map((group) => {
              const page = preset.groupPages[group.key];
              return (
                <LibraryGroupCarousel
                  group={group}
                  groupBy={preset.collection!.groupBy as LibraryGroupBy}
                  hasMore={page?.hasMore ?? Boolean(group.hasMore)}
                  items={page?.items ?? []}
                  key={group.key}
                  loadingMore={page?.loadingMore ?? false}
                  mediaType={mediaType}
                  onLoadMore={() => void preset.loadMoreGroup(group.key)}
                />
              );
            })
          ) : preset.count === 0 ? (
            <EmptyState
              description={LIBRARY_EMPTY_DESCRIPTION}
              icon={emptyIcon}
              title={LIBRARY_EMPTY_TITLE}
            />
          ) : (
            <LibrarySection
              count={preset.count}
              emptyIcon={emptyIcon}
              hasMore={preset.metadata?.hasMore ?? false}
              loadingMore={preset.loadingMore}
              onLoadMore={() => void preset.loadMoreGallery()}
              title={preset.collection.name}
            >
              {isMovies
                ? preset.items.map((movie) => (
                    <MovieCard
                      key={movie.tmdb_id}
                      movie={movie as typeof movies[number]}
                    />
                  ))
                : preset.items.map((show) => (
                    <SeriesCard
                      key={show.tmdb_id}
                      series={show as typeof series[number]}
                    />
                  ))}
            </LibrarySection>
          )
        ) : !isLoaded ? null : currentCount === 0 ? (
          <EmptyState
            description={LIBRARY_EMPTY_DESCRIPTION}
            icon={emptyIcon}
            title={LIBRARY_EMPTY_TITLE}
          />
        ) : isManualGrouped && groups ? (
          groups.map((group) => {
            const page = groupPages[group.key];
            return (
              <LibraryGroupCarousel
                group={group}
                groupBy={query.groupBy}
                hasMore={page?.hasMore ?? Boolean(group.hasMore)}
                items={page?.items ?? []}
                key={group.key}
                loadingMore={page?.loadingMore ?? false}
                mediaType={mediaType}
                onLoadMore={() =>
                  dispatch(
                    libraryGroupPageRequested({
                      type: mediaType,
                      groupKey: group.key,
                    }),
                  )
                }
              />
            );
          })
        ) : (
          <LibrarySection
            count={currentCount}
            emptyIcon={emptyIcon}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={() =>
              dispatch(libraryPageRequested({ type: mediaType }))
            }
            title={isMovies ? "Movies" : "Series"}
          >
            {isMovies
              ? movies.map((movie) => (
                  <MovieCard key={movie.tmdb_id} movie={movie} />
                ))
              : series.map((show) => (
                  <SeriesCard key={show.tmdb_id} series={show} />
                ))}
          </LibrarySection>
        )}
      </div>
      {isLoading && <LoadingOverlay />}
    </main>
  );
}
