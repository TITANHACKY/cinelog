"use client";

import { Clock, Languages, Shield } from "lucide-react";
import type { MovieDetails, SeriesDetails } from "@/lib/types";
import { orFallback } from "@/lib/utils";
import { useLocales } from "@/hooks/locales/use-locales";

type SpecificationsMetaProps = {
  movie?: MovieDetails | null;
  series?: SeriesDetails | null;
  type?: "movie" | "series";
};

export function SpecificationsMeta({
  movie,
  series,
  type,
}: SpecificationsMetaProps) {
  const isMovie = type === "movie" || Boolean(movie);
  const media = movie ?? series;
  const { formatLanguage } = useLocales();

  if (!media) return null;

  // Age Rating
  const ageRatingRaw = isMovie
    ? movie?.certification?.certification
    : series?.content_ratings?.rating;
  const ageRating = ageRatingRaw?.trim() ? ageRatingRaw : "NR";

  // Runtime / Episodes
  let runtimeOrEp = "N/A";
  if (isMovie && movie?.runtime) {
    runtimeOrEp = `${movie.runtime}m`;
  } else if (!isMovie && series) {
    const epCount = series.number_of_episodes;
    const seasonCount = series.number_of_seasons;
    if (epCount && seasonCount) {
      runtimeOrEp = `${seasonCount} Season${seasonCount > 1 ? "s" : ""} • ${epCount} Ep${epCount > 1 ? "s" : ""}`;
    } else if (epCount) {
      runtimeOrEp = `${epCount} Episodes`;
    }
  }

  // Audio / Language
  const origLang = media.original_language;
  const audioTracks = origLang ? formatLanguage(origLang) : "N/A";

  // Synopsis
  const synopsis = orFallback(media.overview, "No synopsis available.");

  // Original Creator / Director
  let creator = "N/A";
  if (!isMovie && series?.created_by && series.created_by.length > 0) {
    creator = series.created_by
      .map((c) => c.name)
      .filter(Boolean)
      .join(", ");
  } else if (media.credits) {
    const director = media.credits.find((c) => c.job === "Director");
    if (director?.name) {
      creator = director.name;
    }
  }

  // Lead Studio
  const leadStudio = media.production_companies?.[0]?.name ?? "N/A";

  return (
    <section className="m-2.5 sm:m-4 space-y-4 sm:space-y-6 rounded-xl sm:rounded-[22px] border border-outline-variant bg-surface-container p-4 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      {/* Section Header */}
      <h2 className="font-bold uppercase tracking-wider font-noto-sans text-sm sm:text-base">
        Specifications & Meta
      </h2>

      {/* Top Grid Cards */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
        {/* Age Rating */}
        <div className="flex items-center gap-3.5 rounded-xl border border-outline-variant bg-surface-container-high p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-outline-muted">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline-muted">
              Age Rating
            </span>
            <span className="text-sm font-bold text-on-surface">
              {ageRating}
            </span>
          </div>
        </div>

        {/* Runtime / EP */}
        <div className="flex items-center gap-3.5 rounded-xl border border-outline-variant bg-surface-container-high p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-outline-muted">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline-muted">
              {isMovie ? "Runtime" : "Seasons • Episodes"}
            </span>
            <span className="text-sm font-bold text-on-surface">
              {runtimeOrEp}
            </span>
          </div>
        </div>

        {/* Audio Tracks */}
        <div className="flex items-center gap-3.5 rounded-xl border border-outline-variant bg-surface-container-high p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-outline-muted">
            <Languages className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline-muted">
              Audio Tracks
            </span>
            <span className="text-sm font-bold text-on-surface">
              {audioTracks}
            </span>
          </div>
        </div>
      </div>

      {/* Synopsis Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-outline-muted">
          Synopsis
        </h3>
        <p className="text-sm leading-relaxed text-secondary sm:text-base">
          {synopsis}
        </p>
      </div>

      {/* Footer Meta Grid */}
      <div className="border-t border-outline-variant pt-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <span className="block text-xs font-medium text-outline-muted">
              Original Creator
            </span>
            <span className="mt-1 block text-sm font-semibold text-on-surface truncate">
              {creator}
            </span>
          </div>

          <div>
            <span className="block text-xs font-medium text-outline-muted">
              Lead Studio
            </span>
            <span className="mt-1 block text-sm font-semibold text-on-surface truncate">
              {leadStudio}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpecificationsMeta;
