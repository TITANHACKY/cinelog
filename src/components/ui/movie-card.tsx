"use client";

import { CardImpressionToggle } from "@/components/ui/card-impression-toggle";
import { CardStatusToggle } from "@/components/ui/card-status-toggle";
import { MediaCard } from "@/components/ui/media-card";
import { useLibraryItemMutation } from "@/hooks/library/use-library-item-mutation";
import { useLocales } from "@/hooks/locales/use-locales";
import { formatMediaMeta, getYearString } from "@/lib/media/display";
import { canUpdateMovieWatchActivity } from "@/lib/media/status";
import type { LibraryMovie } from "@/lib/types";

export function MovieCard({ movie }: { movie: LibraryMovie }) {
  const {
    isPending,
    isImpressionPending,
    isStatusPending,
    requestMutation,
  } = useLibraryItemMutation("movie", movie.tmdb_id);
  const canUpdateWatchActivity = canUpdateMovieWatchActivity(movie.status);
  const { formatLanguage, formatCountry } = useLocales();

  return (
    <MediaCard
      actions={
        <>
          <CardImpressionToggle
            disabled={isPending || !canUpdateWatchActivity}
            loading={isImpressionPending}
            impression={movie.impression}
            onSelect={(impression) => requestMutation({ impression })}
          />
          <CardStatusToggle
            disabled={isPending || !canUpdateWatchActivity}
            loading={isStatusPending}
            onSelect={(watchStatus) =>
              requestMutation({ watch_status: watchStatus })
            }
            watchStatus={movie.watch_status}
          />
        </>
      }
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
