"use client";

import { ActionBar } from "@/components/content-detail/hero-header/action-bar";
import { GenrePills } from "@/components/content-detail/hero-header/genre-pills";
import { PosterPanel } from "@/components/content-detail/hero-header/poster-panel";
import type { MovieDetails, SeriesDetails } from "@/lib/types";
import { orFallback } from "@/lib/utils";
import { useContentMutationState } from "@/hooks/title-details/use-content-mutation-state";
import Image from "next/image";

import { MovieSpecs } from "@/components/content-detail/hero-header/movie-specs";

type HeroHeaderProps = {
  movie?: MovieDetails | null;
  series?: SeriesDetails | null;
  type?: "movie" | "series";
};

export function HeroHeader({ movie, series, type }: HeroHeaderProps) {
  const mediaType: "movie" | "series" = type ?? (movie ? "movie" : "series");
  const mediaId = movie?.id ?? series?.id;
  const entry = useContentMutationState(mediaType, mediaId);
  const title = orFallback(movie?.title || series?.name);
  const releaseDate = movie?.release_date || series?.first_air_date;
  const releaseYear =
    releaseDate && releaseDate.length >= 4 ? releaseDate.slice(0, 4) : null;
  const synopsis = movie?.overview?.trim();
  const tagline = series?.tagline?.trim() || movie?.tagline?.trim();
  const descriptionText = mediaType === "movie" ? synopsis : tagline;
  const genres = movie?.genres ?? series?.genres;
  const imdbId = movie?.imdb_id ?? series?.imdb_id;
  const posterPath = movie?.poster_path ?? series?.poster_path;
  const rating = movie?.vote_average ?? series?.vote_average;
  const backdropPath = movie?.backdrop_path ?? series?.backdrop_path;

  return (
    <section
      className="relative m-2.5 sm:m-4 rounded-xl sm:rounded-[16px] border border-outline-variant bg-linear-to-b from-surface-container-low via-surface-container to-surface p-3.5 sm:p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
      aria-label="Title header"
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-[16px] pointer-events-none">
        {backdropPath ? (
          <>
            <Image
              alt=""
              className="object-cover opacity-50 blur-xs scale-105"
              fill
              priority
              sizes="100vw"
              src={`https://image.tmdb.org/t/p/original${backdropPath}`}
            />
          </>
        ) : (
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-tertiary/10 blur-xl" />
        )}
      </div>

      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-x-8">
        <PosterPanel posterPath={posterPath} rating={rating} title={title} />

        <div className="col-span-1 flex min-w-0 flex-col justify-end md:col-span-9">
          <div className="flex flex-col gap-3">
            {/* <MetaRow movie={movie} series={series} type={mediaType} /> */}

            <div className="space-y-2">
              <h1 className="font-heading text-2xl leading-tight text-on-surface sm:text-4xl md:text-[48px] md:leading-[0.96]">
                {title}
                {releaseYear ? (
                  <span className="ml-2 font-normal text-on-surface-variant">
                    ({releaseYear})
                  </span>
                ) : null}
              </h1>

              {descriptionText && (
                <p className="max-w-full wrap-break-words text-[15px] font-normal leading-relaxed text-on-surface-variant md:max-w-230">
                  {descriptionText}
                </p>
              )}
            </div>

            <GenrePills genres={genres} type={series?.type ?? mediaType} />

            {mediaType === "movie" && movie && <MovieSpecs movie={movie} />}
          </div>

          <ActionBar
            id={mediaId}
            imdbId={imdbId}
            type={mediaType}
            isPresentInWatchlist={
              movie?.is_present_in_watchlist ?? series?.is_present_in_watchlist
            }
            impression={movie?.impression ?? series?.impression ?? null}
            watchStatus={movie?.watch_status ?? series?.watch_status}
            mutationStatus={entry?.mutationStatus}
            lastMutation={entry?.lastMutation}
            pendingValue={entry?.pendingValue}
            content={movie ?? series ?? undefined}
          />
        </div>
      </div>
    </section>
  );
}

export default HeroHeader;
