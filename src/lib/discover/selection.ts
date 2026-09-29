import type { DiscoverGenreOption, DiscoverMedia } from "@/lib/types";

export type RowSelection = { media: DiscoverMedia; value: string | null };

function asRecord(stored: unknown): Record<string, unknown> {
  return stored !== null && typeof stored === "object"
    ? (stored as Record<string, unknown>)
    : {};
}

// The user's remembered dropdown value, even if it isn't valid for the
// current media (Thriller while Series is selected) — kept so switching back
// restores it.
export function storedRowValue(stored: unknown): string | null {
  const value = asRecord(stored).value;
  return typeof value === "string" ? value : null;
}

export function resolveRowSelection(input: {
  stored: unknown;
  lockedMedia: DiscoverMedia | null;
  optionsFor: (media: DiscoverMedia) => string[];
}): RowSelection {
  const record = asRecord(input.stored);
  const media: DiscoverMedia =
    input.lockedMedia ?? (record.media === "series" ? "series" : "movie");
  const options = input.optionsFor(media);
  const stored = storedRowValue(input.stored);
  return {
    media,
    value:
      stored !== null && options.includes(stored)
        ? stored
        : (options[0] ?? null),
  };
}

// Dropdown options for "Top picks": the user's genres that exist for this
// media type, in pick order, one entry per TMDB genre id.
export function genreOptionsFor(
  genres: DiscoverGenreOption[],
  media: DiscoverMedia,
): Array<{ value: string; label: string; genreId: number }> {
  const seen = new Set<number>();
  const options: Array<{ value: string; label: string; genreId: number }> = [];
  for (const genre of genres) {
    const genreId = media === "movie" ? genre.movieId : genre.seriesId;
    if (genreId === null || seen.has(genreId)) continue;
    seen.add(genreId);
    options.push({ value: String(genre.id), label: genre.name, genreId });
  }
  return options;
}
