"use client";

import { Languages, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { WATCH_STATUS } from "@/lib/constants";
import {
  WATCH_STATUS_ICONS,
  WATCH_STATUS_INDICATOR,
  WATCH_STATUS_INDICATOR_TEXT,
} from "@/lib/media/watch-status";
import { cn, formatRating } from "@/lib/utils";
import { useLocales } from "@/hooks/locales/use-locales";

type MovieItemProps = {
  id?: number;
  title?: string;
  year?: string | number;
  rating?: string | number;
  genre?: string;
  isPresentInWatchlist?: boolean;
  mediaType?: "movie" | "series";
  originalLanguage?: string;
  synopsis?: string;
  poster?: string;
  posterAlt?: string;
  actionLabel?: string;
  onItemClick?: () => void;
  className?: string;
  state?: "default" | "loading" | "failed";
  watchStatus?: number | null;
};

function MovieItem({
  className,
  genre,
  id,
  isPresentInWatchlist = false,
  mediaType,
  onItemClick,
  originalLanguage,
  poster,
  posterAlt,
  rating,
  synopsis,
  title,
  watchStatus,
  year,
  state = "default",
}: MovieItemProps) {
  const status =
    watchStatus != null
      ? WATCH_STATUS[watchStatus as keyof typeof WATCH_STATUS]
      : undefined;
  const { formatLanguage } = useLocales();
  const statusIndicator =
    watchStatus != null
      ? (WATCH_STATUS_INDICATOR[watchStatus] ?? WATCH_STATUS_INDICATOR[0])
      : undefined;
  const StatusIcon =
    watchStatus != null
      ? (WATCH_STATUS_ICONS[
          watchStatus as keyof typeof WATCH_STATUS_ICONS
        ] ?? WATCH_STATUS_ICONS[0])
      : undefined;
  const showWatchStatus =
    state === "default" &&
    isPresentInWatchlist &&
    status &&
    StatusIcon &&
    statusIndicator;

  return (
    <article
      className={cn(
        "relative flex min-h-28 w-full items-stretch gap-2.5 overflow-hidden rounded-xl border border-transparent bg-surface-container-high p-2 text-on-surface hover:bg-surface sm:min-h-40 sm:gap-4",
        className,
      )}
    >
      {showWatchStatus ? (
        <div className="pointer-events-none absolute right-2 top-2 z-10 sm:right-3 sm:top-3">
          <span
            aria-label={status.display_value}
            className="flex size-8 items-center justify-center rounded-[6px] bg-surface-container-low p-1.5"
            title={status.display_value}
          >
            <StatusIcon
              className={cn(
                "size-4",
                WATCH_STATUS_INDICATOR_TEXT[statusIndicator],
              )}
            />
          </span>
        </div>
      ) : null}
      {state === "loading" ? (
        <div className="flex w-full animate-pulse items-center gap-2.5 px-1 py-1 sm:gap-4 sm:px-2 sm:py-3">
          <div className="h-28 w-20 shrink-0 rounded-lg bg-surface-container-low sm:h-36 sm:w-24" />
          <div className="flex flex-1 flex-col gap-2 sm:gap-3">
            <div className="h-4 w-2/3 rounded bg-surface-container-low sm:h-5" />
            <div className="h-2.5 w-1/3 rounded bg-surface-container-low sm:h-3" />
            <div className="h-2.5 w-full rounded bg-surface-container-low sm:h-3" />
            <div className="h-2.5 w-4/5 rounded bg-surface-container-low sm:h-3" />
          </div>
        </div>
      ) : state === "failed" ? (
        <div className="flex min-h-28 w-full items-center justify-center px-4 py-6 text-center sm:min-h-36 sm:py-8">
          <h3 className="font-heading text-base font-semibold text-on-surface sm:text-lg">
            {title ?? "No results found"}
          </h3>
        </div>
      ) : (
        <>
          <Link
            href={id !== undefined ? `/${mediaType}/${id}` : "#"}
            className="flex min-w-0 flex-1 items-stretch gap-2.5 sm:gap-4"
            onClick={onItemClick}
          >
            <div className="flex w-20 shrink-0 self-stretch items-center justify-center sm:w-24">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-outline-alt bg-surface-container-low shadow-md">
                {poster && (
                  <Image
                    alt={posterAlt ?? `${title ?? "Movie"} poster`}
                    className="object-cover"
                    fill
                    src={poster}
                    sizes="(max-width: 640px) 80px, 96px"
                  />
                )}
              </div>
            </div>

            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col justify-start py-1 sm:py-3",
                showWatchStatus && "pr-12",
              )}
            >
              <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2">
                <h3 className="truncate font-heading text-base font-semibold leading-6 text-on-surface sm:text-lg sm:leading-7">
                  {title ?? "Untitled"}
                </h3>
                {year ? (
                  <span className="shrink-0 font-public-sans text-[11px] text-outline-muted sm:text-xs">
                    ({year})
                  </span>
                ) : null}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-public-sans text-[11px] sm:gap-2 sm:text-xs">
                {rating !== undefined ? (
                  <span className="flex items-center gap-1 font-semibold text-brand-tertiary-accent-alt">
                    <Star className="size-3 fill-current sm:size-3.5" />
                    {formatRating(rating)}
                  </span>
                ) : null}
                {genre ? <span className="text-outline-muted">•</span> : null}
                {genre ? <span className="text-secondary">{genre}</span> : null}
                {originalLanguage ? (
                  <span className="text-outline-muted">•</span>
                ) : null}
                {originalLanguage ? (
                  <span className="flex items-center gap-1 text-secondary">
                    <Languages className="size-2.5 sm:size-3" />
                    {formatLanguage(originalLanguage)}
                  </span>
                ) : null}
              </div>

              {synopsis ? (
                <p className="mt-1 line-clamp-2 max-w-2xl font-public-sans text-[11px] leading-4 text-outline-muted sm:mt-2 sm:text-xs sm:leading-5">
                  {synopsis}
                </p>
              ) : null}
            </div>
          </Link>
        </>
      )}
    </article>
  );
}

export { MovieItem };
export type { MovieItemProps };
