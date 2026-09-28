"use client";

import { CardRemoveButton } from "@/components/ui/card-remove-button";
import { CardStatusToggle } from "@/components/ui/card-status-toggle";
import { MediaCard } from "@/components/ui/media-card";
import { Tooltip } from "@/components/ui/tooltip";
import { useLibraryItemMutation } from "@/hooks/library/use-library-item-mutation";
import { useLocales } from "@/hooks/locales/use-locales";
import { NON_RELEASED_MEDIA_TOOLTIP } from "@/lib/constants";
import { formatMediaMeta, getYearString } from "@/lib/media/display";
import {
  canUpdateMovieWatchActivity,
  isMovieWatchable,
} from "@/lib/media/status";
import type { LibraryMovie } from "@/lib/types";

export function MovieCard({
  movie,
  actionsPosition,
}: {
  movie: LibraryMovie;
  actionsPosition?: "inline" | "below";
}) {
  const {
    isPending,
    isStatusPending,
    isRemovePending,
    requestMutation,
    requestRemove,
  } = useLibraryItemMutation("movie", movie.tmdb_id);
  const canUpdateWatchActivity = canUpdateMovieWatchActivity(movie.status);
  const watchStatus = movie.watch_status ?? 0;
  const isWatchable = isMovieWatchable(movie.status, movie.release_date);
  const { formatLanguage, formatCountry } = useLocales();
  const resolvedActionsPosition = actionsPosition ?? "below";

  const removeButton = (
    <CardRemoveButton
      disabled={isPending}
      loading={isRemovePending}
      onClick={() => requestRemove({ title: movie.title })}
    />
  );

  const statusToggle = (
    <CardStatusToggle
      disabled={
        isPending ||
        (watchStatus === 0 ? !isWatchable : !canUpdateWatchActivity)
      }
      expanded={resolvedActionsPosition === "below"}
      loading={isStatusPending}
      onSelect={(nextWatchStatus) =>
        requestMutation({ watch_status: nextWatchStatus, title: movie.title })
      }
      watchStatus={watchStatus}
    />
  );

  const actions = (
    <>
      {removeButton}
      {watchStatus === 0 && !isWatchable ? (
        <Tooltip
          align="end"
          className={
            resolvedActionsPosition === "below" ? "flex-1 min-w-0" : undefined
          }
          content={NON_RELEASED_MEDIA_TOOLTIP}
          contentClassName="whitespace-nowrap"
          triggerClassName={
            resolvedActionsPosition === "below" ? "w-full" : undefined
          }
        >
          {statusToggle}
        </Tooltip>
      ) : (
        statusToggle
      )}
    </>
  );

  return (
    <MediaCard
      actions={actions}
      actionsPosition={resolvedActionsPosition}
      href={`/movie/${movie.tmdb_id}`}
      meta={formatMediaMeta(
        formatLanguage(movie.original_language),
        formatCountry(movie.origin_country),
      )}
      posterPath={movie.poster_path}
      rating={(movie.vote_average ?? 0).toFixed(1)}
      title={movie.title}
      year={getYearString(movie.release_date ?? undefined)}
    />
  );
}
