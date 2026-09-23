import { TMDB_POSTER_BASE_URL } from "@/lib/constants";

export function getYearNumber(date: string | null | undefined) {
  return date ? Number(date.slice(0, 4)) : 0;
}

export function getYearString(date: string | undefined) {
  return date?.slice(0, 4) ?? "";
}

export function posterUrl(
  path: string | null | undefined,
  fallback: string,
) {
  return path ? `${TMDB_POSTER_BASE_URL}${path}` : fallback;
}

export function nowUnixSeconds() {
  return String(Math.floor(Date.now() / 1000));
}

export function formatMediaMeta(
  language?: string | null,
  country?: string | null,
) {
  const parts = [
    language?.trim() || null,
    country?.trim() || null,
  ].filter(Boolean);

  return parts.join(" · ");
}
