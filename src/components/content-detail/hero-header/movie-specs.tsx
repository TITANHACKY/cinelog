"use client";

import { useMemo } from "react";
import { Clock, Globe, Shield, User, Video } from "lucide-react";
import { useLocales } from "@/hooks/locales/use-locales";
import { useGetPreferencesQuery } from "@/store/api/user-api";
import type { MovieDetails } from "@/lib/types";

type MovieSpecsProps = {
  movie: MovieDetails;
};

export function MovieSpecs({ movie }: MovieSpecsProps) {
  const { formatLanguage } = useLocales();
  const { data: preferences } = useGetPreferencesQuery();

  const ageRating = movie.certification?.certification?.trim() || "NR";
  const runtimeDisplay = movie.runtime ? `${movie.runtime}m` : "N/A";

  const originalLangCode = movie.original_language;
  const originalLangName = originalLangCode
    ? formatLanguage(originalLangCode)
    : "N/A";

  const userPreferredCodes = useMemo(() => {
    return preferences?.languages ?? [];
  }, [preferences?.languages]);

  // Track available languages matching user preferences (excluding original language)
  const matchedLanguages = useMemo(() => {
    const available = movie.spoken_languages ?? [];
    const userSet = new Set(userPreferredCodes);

    return available
      .filter(
        (lang) =>
          lang.iso_639_1 &&
          lang.iso_639_1 !== originalLangCode &&
          userSet.has(lang.iso_639_1),
      )
      .map(
        (lang) =>
          formatLanguage(lang.iso_639_1) || lang.english_name || lang.iso_639_1,
      );
  }, [
    movie.spoken_languages,
    originalLangCode,
    userPreferredCodes,
    formatLanguage,
  ]);

  const director = movie.director?.name ?? "N/A";
  const creators =
    movie.creators && movie.creators.length > 0
      ? movie.creators.map((c) => c.name).join(", ")
      : "N/A";
  const leadStudio = movie.lead_studio ?? "N/A";
  const network = movie.network ?? movie.lead_studio ?? "N/A";

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container/60 p-3 sm:p-4 backdrop-blur-xs">
      {/* Quick Specs Badges */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        {/* Age Rating */}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1 font-semibold text-on-surface">
          <Shield className="h-3.5 w-3.5 text-outline-muted" />
          <span>{ageRating}</span>
        </span>

        {/* Runtime */}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1 font-medium text-on-surface">
          <Clock className="h-3.5 w-3.5 text-outline-muted" />
          <span>{runtimeDisplay}</span>
        </span>

        {/* Original Language (common) */}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 font-medium text-brand-primary">
          <Globe className="h-3.5 w-3.5" />
          <span>{originalLangName} (Original)</span>
        </span>

        {/* Matched User Preferred Languages */}
        {matchedLanguages.map((langName) => (
          <span
            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-highest px-2 py-0.5 text-[11px] font-medium text-secondary"
            key={langName}
          >
            <span>{langName}</span>
          </span>
        ))}
      </div>

      {/* Credits & Production Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 pt-1 border-t border-outline-variant/60 text-xs">
        <div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-outline-muted">
            <User className="h-3 w-3" />
            Director
          </span>
          <span
            className="mt-0.5 block font-semibold text-on-surface truncate"
            title={director}
          >
            {director}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-outline-muted truncate">
            Original Creator / Writer
          </span>
          <span
            className="mt-0.5 block font-semibold text-on-surface truncate"
            title={creators}
          >
            {creators}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-outline-muted truncate">
            Lead Studio
          </span>
          <span
            className="mt-0.5 block font-semibold text-on-surface truncate"
            title={leadStudio}
          >
            {leadStudio}
          </span>
        </div>

        <div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-outline-muted truncate">
            <Video className="h-3 w-3" />
            Release Network
          </span>
          <span
            className="mt-0.5 block font-semibold text-on-surface truncate"
            title={network}
          >
            {network}
          </span>
        </div>
      </div>
    </div>
  );
}

export default MovieSpecs;
