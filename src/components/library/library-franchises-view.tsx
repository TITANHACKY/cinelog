"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Layers, Loader2, Trash2 } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MEDIA_TYPES } from "@/lib/constants/library";
import {
  useGetFollowedFranchisesQuery,
  useGetFranchiseDetailsQuery,
  useUnfollowFranchiseMutation,
  type FollowedFranchiseItem,
} from "@/store/api/franchises-api";
import { useGetDashboardQuery } from "@/store/api/library-api";
import { showToast } from "@/store/slices/toastSlice";
import { useAppDispatch } from "@/store";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/ui/movie-card";
import type { LibraryMovie } from "@/lib/types";

export function LibraryFranchisesView() {
  const { data: franchises = [], isLoading } = useGetFollowedFranchisesQuery();
  const { data: dashboard } = useGetDashboardQuery();
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number | null>(
    null,
  );

  const movieCount = dashboard?.counts?.movies ?? 0;
  const seriesCount = dashboard?.counts?.series ?? 0;
  const franchiseCount = franchises.length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Media Type Navigation Switcher */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Filter library by media type"
          className="min-w-0 basis-full lg:basis-0 lg:flex-1"
          options={MEDIA_TYPES.map(({ icon: Icon, label, value, href }) => {
            const count =
              value === "movie"
                ? movieCount
                : value === "series"
                  ? seriesCount
                  : franchiseCount;

            return {
              value,
              label,
              href,
              icon: <Icon className="size-3.5 shrink-0" />,
              badge: (
                <span
                  aria-label={`${count} ${label}`}
                  className={`inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-md px-1.5 font-public-sans text-[10px] leading-none font-medium ${
                    value === "franchises"
                      ? "bg-white/25 text-white"
                      : "bg-surface-container text-secondary"
                  }`}
                >
                  {count}
                </span>
              ),
            };
          })}
          value="franchises"
        />
      </div>

      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface">
          Followed Franchises
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Franchises you follow. All movies in these franchises are
          automatically synced to your library.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : franchises.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/60 p-12 text-center backdrop-blur-xs">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-high text-outline-muted">
            <Layers className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-lg font-bold text-on-surface">
            No followed franchises yet
          </h2>
          <p className="mt-2 max-w-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            When you view a movie that is part of a franchise (e.g. Harry
            Potter, Marvel, Avatar), click &quot;Follow Franchise&quot; to track
            the entire franchise and its movies right here.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-xs font-semibold text-brand-on-primary hover:bg-brand-primary/90 transition"
            href="/library/movies"
          >
            <span>Explore Movies</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {franchises.map((franchise) => (
            <FranchiseLibraryCard
              franchise={franchise}
              key={franchise.id}
              onSelect={() => setSelectedFranchiseId(franchise.tmdbId)}
            />
          ))}
        </div>
      )}

      {/* Franchise Modal / Drawer if a franchise is selected */}
      {selectedFranchiseId && (
        <FranchiseDetailModal
          franchiseTmdbId={selectedFranchiseId}
          onClose={() => setSelectedFranchiseId(null)}
        />
      )}
    </div>
  );
}

function FranchiseLibraryCard({
  franchise,
  onSelect,
}: {
  franchise: FollowedFranchiseItem;
  onSelect: () => void;
}) {
  const dispatch = useAppDispatch();
  const [unfollowFranchise, { isLoading }] = useUnfollowFranchiseMutation();

  async function handleUnfollow(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await unfollowFranchise({ id: franchise.tmdbId }).unwrap();
      dispatch(
        showToast({
          message: `Unfollowed ${franchise.name}`,
          variant: "info",
        }),
      );
    } catch {
      dispatch(
        showToast({
          message: "Failed to unfollow franchise",
          variant: "error",
        }),
      );
    }
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container/70 transition hover:border-outline hover:bg-surface-container cursor-pointer"
      onClick={onSelect}
    >
      <div className="relative aspect-16/9 w-full overflow-hidden bg-surface-container-high">
        {franchise.backdropPath || franchise.posterPath ? (
          <Image
            alt={franchise.name}
            className="object-cover transition duration-300 group-hover:scale-105 opacity-80"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={`https://image.tmdb.org/t/p/w780${franchise.backdropPath || franchise.posterPath}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
            <Layers className="h-10 w-10 text-outline-muted/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-surface via-transparent to-transparent" />

        <button
          aria-label={`Unfollow ${franchise.name}`}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-outline-muted transition hover:bg-black/90 hover:text-red-400"
          disabled={isLoading}
          onClick={handleUnfollow}
          title="Unfollow franchise"
          type="button"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
            Franchise
          </span>
          <h2 className="font-heading text-base font-bold text-on-surface group-hover:text-brand-primary transition">
            {franchise.name}
          </h2>
          {franchise.overview && (
            <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant leading-relaxed">
              {franchise.overview}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-outline-variant/60 pt-3 text-xs text-brand-primary font-semibold">
          <span>View all movies</span>
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}

function FranchiseDetailModal({
  franchiseTmdbId,
  onClose,
}: {
  franchiseTmdbId: number;
  onClose: () => void;
}) {
  const { data: franchise, isLoading } = useGetFranchiseDetailsQuery({
    id: franchiseTmdbId,
  });

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      role="dialog"
    >
      <div className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-brand-primary" />
            <h2 className="font-heading text-lg font-bold text-on-surface truncate">
              {franchise?.name ?? "Franchise Details"}
            </h2>
          </div>

          <Button
            className="h-8 rounded-lg px-3 text-xs font-semibold"
            onClick={onClose}
            type="button"
            variant="darkFilled"
          >
            Close
          </Button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
            </div>
          ) : !franchise ? (
            <p className="text-center text-sm text-secondary">
              Unable to load franchise details.
            </p>
          ) : (
            <>
              {franchise.overview && (
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {franchise.overview}
                </p>
              )}

              <div className="grid grid-cols-2 justify-items-stretch gap-3 sm:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] sm:gap-x-4 sm:gap-y-6">
                {franchise.parts.map((part) => {
                  const movieItem: LibraryMovie = {
                    tmdb_id: part.id,
                    watch_status: part.watch_status ?? 0,
                    impression: null,
                    created_at: null,
                    updated_at: null,
                    completed_at: null,
                    title: part.title ?? "Untitled",
                    poster_path: part.poster_path ?? null,
                    release_date: part.release_date ?? null,
                    vote_average: part.vote_average ?? 0,
                    status: "Released",
                    original_language: part.original_language ?? null,
                    origin_country: null,
                    is_present_in_watchlist:
                      part.is_present_in_watchlist ?? false,
                  };

                  return (
                    <div
                      className="min-w-0 w-full"
                      key={part.id}
                      onClick={onClose}
                    >
                      <MovieCard actionsPosition="below" movie={movieItem} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LibraryFranchisesView;
