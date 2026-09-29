"use client";

import Image from "next/image";
import { Check, Layers, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/ui/movie-card";
import { cn } from "@/lib/utils";
import {
  useFollowFranchiseMutation,
  useGetFranchiseDetailsQuery,
  useUnfollowFranchiseMutation,
} from "@/store/api/franchises-api";
import { showToast } from "@/store/slices/toastSlice";
import { useAppDispatch } from "@/store";
import type { LibraryMovie, MovieFranchiseInfo } from "@/lib/types";

type FranchiseCardProps = {
  franchise: MovieFranchiseInfo;
  currentMovieId?: number;
};

export function FranchiseCard({
  franchise,
  currentMovieId,
}: FranchiseCardProps) {
  const dispatch = useAppDispatch();

  const { data: franchiseDetails, isLoading: isDetailsLoading } =
    useGetFranchiseDetailsQuery({ id: franchise.id });

  const [followFranchise, { isLoading: isFollowLoading }] =
    useFollowFranchiseMutation();
  const [unfollowFranchise, { isLoading: isUnfollowLoading }] =
    useUnfollowFranchiseMutation();

  const isFollowing =
    franchiseDetails?.is_following ?? franchise.is_following ?? false;
  const isActionLoading = isFollowLoading || isUnfollowLoading;

  async function handleToggleFollow() {
    try {
      if (isFollowing) {
        await unfollowFranchise({ id: franchise.id }).unwrap();
        dispatch(
          showToast({
            message: `Unfollowed ${franchise.name}`,
            variant: "info",
          }),
        );
      } else {
        await followFranchise({ id: franchise.id }).unwrap();
        dispatch(
          showToast({
            message: `Following ${franchise.name}! All movies added to your library.`,
            variant: "success",
          }),
        );
      }
    } catch {
      dispatch(
        showToast({
          message: "Unable to update franchise follow status",
          variant: "error",
        }),
      );
    }
  }

  const parts = franchiseDetails?.parts ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container/60 backdrop-blur-xs">
      {/* Franchise Header Banner */}
      <div className="relative p-4 sm:p-6">
        {franchise.backdrop_path && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="100vw"
              src={`https://image.tmdb.org/t/p/w1280${franchise.backdrop_path}`}
            />
          </div>
        )}

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-high text-brand-primary">
              <Layers className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-on-surface">
                {franchise.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className={`h-9 gap-1.5 rounded-full px-4 text-xs font-semibold ${
                isFollowing
                  ? "border border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                  : "bg-brand-primary text-brand-on-primary hover:bg-brand-primary/90"
              }`}
              disabled={isActionLoading}
              onClick={() => void handleToggleFollow()}
              type="button"
            >
              {isActionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isFollowing ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>
                {isFollowing ? "Following Franchise" : "Follow Franchise"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Franchise Movies Grid */}
      <div className="border-t border-outline-variant/60 p-4 sm:p-6 bg-surface-container-low/30">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-outline-muted">
            All Movies in this Franchise ({parts.length})
          </span>
        </div>

        {isDetailsLoading && parts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 justify-items-stretch gap-3 sm:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] sm:gap-x-4 sm:gap-y-6">
            {parts.map((part) => {
              const isCurrent = part.id === currentMovieId;
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
                  className={cn(
                    "relative rounded-[8px] min-w-0 w-full transition-all",
                    isCurrent &&
                      "ring-2 ring-brand-primary ring-offset-2 ring-offset-surface-container",
                  )}
                  key={part.id}
                >
                  {isCurrent && (
                    <div className="absolute top-9 left-3 z-20 pointer-events-none rounded-xs bg-brand-primary px-1.5 py-0.5 font-public-sans text-[10px] font-bold text-brand-on-primary shadow-md">
                      Current
                    </div>
                  )}
                  <MovieCard actionsPosition="below" movie={movieItem} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default FranchiseCard;
