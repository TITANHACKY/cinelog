import {
  MOVIE_STATUS,
  SERIES_STATUS,
  WATCHABLE_MOVIE_STATUSES,
  WATCHABLE_SERIES_STATUSES,
} from "@/lib/constants";
import { hasAiredOnOrBeforeToday } from "@/lib/media/air-date";

export type MovieStatusValue =
  (typeof MOVIE_STATUS)[keyof typeof MOVIE_STATUS]["value"];
export type SeriesStatusValue =
  (typeof SERIES_STATUS)[keyof typeof SERIES_STATUS]["value"];
export type MovieStatusDisplay =
  (typeof MOVIE_STATUS)[keyof typeof MOVIE_STATUS]["display_value"];
export type SeriesStatusDisplay =
  (typeof SERIES_STATUS)[keyof typeof SERIES_STATUS]["display_value"];

type StatusEntry = { value: string; display_value: string };

function matchStatus<T extends StatusEntry>(
  statuses: Record<string, T>,
  input: string | null | undefined,
): T | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  for (const entry of Object.values(statuses)) {
    if (entry.value === lower || entry.display_value.toLowerCase() === lower) {
      return entry;
    }
  }

  return null;
}

export function normalizeMovieStatus(
  input: string | null | undefined,
): MovieStatusValue | null {
  return (matchStatus(MOVIE_STATUS, input)?.value as MovieStatusValue) ?? null;
}

export function normalizeSeriesStatus(
  input: string | null | undefined,
): SeriesStatusValue | null {
  return (matchStatus(SERIES_STATUS, input)?.value as SeriesStatusValue) ?? null;
}

export function toMovieStatusDisplay(
  input: string | null | undefined,
): MovieStatusDisplay | null {
  return (
    (matchStatus(MOVIE_STATUS, input)?.display_value as MovieStatusDisplay) ??
    null
  );
}

export function toSeriesStatusDisplay(
  input: string | null | undefined,
): SeriesStatusDisplay | null {
  return (
    (matchStatus(SERIES_STATUS, input)?.display_value as SeriesStatusDisplay) ??
    null
  );
}

export function canUpdateMovieWatchActivity(
  status: string | null | undefined,
): boolean {
  const normalized = normalizeMovieStatus(status);
  return normalized !== null && WATCHABLE_MOVIE_STATUSES.has(normalized);
}

export function canUpdateSeriesWatchActivity(
  status: string | null | undefined,
): boolean {
  const normalized = normalizeSeriesStatus(status);
  return normalized !== null && WATCHABLE_SERIES_STATUSES.has(normalized);
}

export function isMovieWatchable(
  status: string | null | undefined,
  releaseDate?: string | null,
): boolean {
  return (
    canUpdateMovieWatchActivity(status) &&
    hasAiredOnOrBeforeToday(releaseDate)
  );
}
