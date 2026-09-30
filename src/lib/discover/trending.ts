import {
  DISCOVER_RECENT_MOVIE_DAYS,
  DISCOVER_RECENT_SERIES_DAYS,
  DISCOVER_TRENDING_MIN,
  DISCOVER_TRENDING_TOP_UP,
} from "@/lib/constants";
import type { DiscoverTitlesParams } from "@/lib/tmdb/discover";
import type { DiscoverMedia, DiscoverTitle } from "@/lib/types";

const PAGE_SIZE = 20;
const TRENDING_BETWEEN_TOP_UPS = 2;

// Movie 123 and series 123 are different titles.
function titleKey(title: DiscoverTitle): string {
  return `${title.mediaType}-${title.tmdbId}`;
}

export function filterByLanguages(
  titles: DiscoverTitle[],
  languages: string[],
): DiscoverTitle[] {
  return titles.filter(
    (title) =>
      title.originalLanguage !== null &&
      languages.includes(title.originalLanguage),
  );
}

// The user's languages (pick order) with no title in the filtered list.
export function missingLanguages(
  filtered: DiscoverTitle[],
  languages: string[],
): string[] {
  const present = new Set(filtered.map((title) => title.originalLanguage));
  return languages.filter((language) => !present.has(language));
}

// Trending page 1: real trending in the user's languages, then up to N
// recent popular titles for each missing language (interleaved), then a
// fallback fill if the page is still short.
export function composeTrendingFirstPage(input: {
  trending: DiscoverTitle[];
  languages: string[];
  topUps: Record<string, DiscoverTitle[]>;
  fallback: DiscoverTitle[];
}): {
  items: DiscoverTitle[];
  stats: { kept: number; topUp: number; fallback: number };
} {
  const seen = new Set<string>();
  const take = (title: DiscoverTitle) => {
    if (seen.has(titleKey(title))) return false;
    seen.add(titleKey(title));
    return true;
  };

  const kept = filterByLanguages(input.trending, input.languages).filter(take);

  // Round-robin across missing languages in pick order.
  const queues = missingLanguages(kept, input.languages).map((language) =>
    (input.topUps[language] ?? [])
      .filter((title) => !seen.has(titleKey(title)))
      .slice(0, DISCOVER_TRENDING_TOP_UP),
  );
  const topUpOrder: DiscoverTitle[] = [];
  for (let index = 0; index < DISCOVER_TRENDING_TOP_UP; index += 1) {
    for (const queue of queues) if (queue[index]) topUpOrder.push(queue[index]);
  }

  const items: DiscoverTitle[] = [];
  let next = 0;
  let topUp = 0;
  const pushTopUp = () => {
    while (next < topUpOrder.length) {
      const title = topUpOrder[next];
      next += 1;
      if (take(title)) {
        items.push(title);
        topUp += 1;
        return;
      }
    }
  };
  kept.forEach((title, index) => {
    items.push(title);
    if ((index + 1) % TRENDING_BETWEEN_TOP_UPS === 0) pushTopUp();
  });
  while (next < topUpOrder.length) pushTopUp();

  let fallback = 0;
  if (items.length < DISCOVER_TRENDING_MIN) {
    for (const title of input.fallback) {
      if (items.length >= PAGE_SIZE) break;
      if (take(title)) {
        items.push(title);
        fallback += 1;
      }
    }
  }

  return { items, stats: { kept: kept.length, topUp, fallback } };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBefore(today: Date, days: number): string {
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - days);
  return isoDate(from);
}

// "Recent popular in <language>": movies from the last year, series with an
// episode aired in the last month. `language` may be pipe-joined (OR).
export function recentParams(
  media: DiscoverMedia,
  language: string,
  today: Date = new Date(),
): DiscoverTitlesParams {
  if (media === "movie") {
    return {
      type: "movie",
      genreIds: [],
      language,
      gteDate: daysBefore(today, DISCOVER_RECENT_MOVIE_DAYS),
      lteDate: isoDate(today),
      sortBy: "popularity.desc",
    };
  }
  return {
    type: "tv",
    genreIds: [],
    language,
    airDateGte: daysBefore(today, DISCOVER_RECENT_SERIES_DAYS),
    airDateLte: isoDate(today),
    sortBy: "popularity.desc",
  };
}
