"use client";

import { useMemo } from "react";
import {
  Calendar,
  Clock,
  Languages,
  MapPin,
  Shield,
  Tv,
  User,
  Video,
} from "lucide-react";
import { formatAirDate } from "@/lib/media/display";
import { toSeriesStatusDisplay } from "@/lib/media/status";
import { useLocales } from "@/hooks/locales/use-locales";
import type { SeriesDetails } from "@/lib/types";

type SeriesSpecsProps = {
  series: SeriesDetails;
};

export function SeriesSpecs({ series }: SeriesSpecsProps) {
  const { formatCountry, formatLanguage } = useLocales();

  const ageRating = series.certification?.certification?.trim() || "NR";
  const statusDisplay =
    toSeriesStatusDisplay(series.status) ?? series.status?.trim() ?? null;
  const seasonCount = series.number_of_seasons ?? 0;
  const episodeCount = series.number_of_episodes ?? 0;
  const seasonsEpisodesDisplay =
    seasonCount > 0 && episodeCount > 0
      ? `${seasonCount} Season${seasonCount > 1 ? "s" : ""} • ${episodeCount} Ep${episodeCount > 1 ? "s" : ""}`
      : seasonCount > 0
        ? `${seasonCount} Season${seasonCount > 1 ? "s" : ""}`
        : episodeCount > 0
          ? `${episodeCount} Episodes`
          : "N/A";

  const firstAired = formatAirDate(series.first_air_date);
  const lastAired = formatAirDate(series.last_air_date);
  const nextEpisode = series.next_episode_to_air;
  const nextEpisodeCode =
    nextEpisode?.season_number !== undefined &&
    nextEpisode.episode_number !== undefined
      ? `S${nextEpisode.season_number}E${nextEpisode.episode_number}`
      : null;
  const nextEpisodeName = nextEpisode?.name?.trim() || null;
  const isGenericNextEpisodeName =
    nextEpisodeName !== null &&
    nextEpisode?.episode_number !== undefined &&
    /^episode\s+\d+$/i.test(nextEpisodeName) &&
    nextEpisodeName.match(/\d+/)?.[0] === String(nextEpisode.episode_number);
  const nextEpisodeDisplay = nextEpisode
    ? [
        nextEpisodeCode,
        isGenericNextEpisodeName ? null : nextEpisodeName,
        formatAirDate(nextEpisode.air_date),
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  const originCountries = useMemo(() => {
    const codes = (series.origin_country ?? []).filter(
      (code): code is string => typeof code === "string" && Boolean(code.trim()),
    );

    if (codes.length === 0 && series.production_companies) {
      const fromCompanies = series.production_companies
        .map((company) => company.origin_country?.trim())
        .filter((code): code is string => Boolean(code));
      return Array.from(new Set(fromCompanies));
    }

    return codes;
  }, [series.origin_country, series.production_companies]);

  const originCountryDisplay = useMemo(() => {
    return originCountries
      .map((code) => formatCountry(code) || code)
      .filter(Boolean)
      .join(", ");
  }, [originCountries, formatCountry]);

  const originalLangCode = series.original_language;
  const originalLangName = originalLangCode
    ? formatLanguage(originalLangCode)
    : "N/A";

  const creators =
    series.created_by && series.created_by.length > 0
      ? series.created_by.map((creator) => creator.name).filter(Boolean).join(", ")
      : "N/A";
  const leadStudio = series.lead_studio ?? "N/A";
  const network = series.network ?? "N/A";

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        {statusDisplay && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-alt bg-surface-container-high px-2.5 py-1 font-medium text-brand-tertiary-accent-alt">
            <Tv className="h-3.5 w-3.5 text-brand-tertiary-accent-alt" />
            <span>{statusDisplay}</span>
          </span>
        )}

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1 font-semibold text-on-surface">
          <Shield className="h-3.5 w-3.5 text-outline-muted" />
          <span>{ageRating}</span>
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1 font-medium text-on-surface">
          <Clock className="h-3.5 w-3.5 text-outline-muted" />
          <span>{seasonsEpisodesDisplay}</span>
        </span>

        {firstAired && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1 font-medium text-on-surface">
            <Calendar className="h-3.5 w-3.5 text-outline-muted" />
            <span>First aired {firstAired}</span>
          </span>
        )}

        {lastAired && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1 font-medium text-on-surface">
            <Calendar className="h-3.5 w-3.5 text-outline-muted" />
            <span>Last aired {lastAired}</span>
          </span>
        )}

        {nextEpisodeDisplay && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 font-medium text-brand-primary">
            <Calendar className="h-3.5 w-3.5" />
            <span>Next: {nextEpisodeDisplay}</span>
          </span>
        )}

        {originCountryDisplay && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1 font-medium text-on-surface">
            <MapPin className="h-3.5 w-3.5 text-outline-muted" />
            <span className="min-w-0 whitespace-nowrap">
              {originCountryDisplay}
            </span>
          </span>
        )}

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 font-medium text-brand-primary">
          <Languages className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 whitespace-nowrap">
            {originalLangName} (Original)
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 pt-1 border-t border-outline-variant/60 text-xs">
        <div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-outline-muted">
            <User className="h-3 w-3" />
            Creator
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
            Network
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

export default SeriesSpecs;
