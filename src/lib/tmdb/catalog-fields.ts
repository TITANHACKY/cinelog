import {
  normalizeMovieStatus,
  normalizeSeriesStatus,
  type MovieStatusValue,
  type SeriesStatusValue,
} from "@/lib/media/status";
import type { MoviePayload, TmdbMovie, TmdbReleaseDate, TmdbSeries } from "@/lib/types";

export type CatalogMovieFields = {
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  status: MovieStatusValue | null;
  originalLanguage: string | null;
  originCountry: string | null;
  certificate: string | null;
};

export type CatalogSeriesFields = {
  name: string;
  posterPath: string | null;
  firstAirDate: string | null;
  lastAirDate: string | null;
  totalNumberOfEpisodes: number | null;
  totalNumberOfSeasons: number | null;
  voteAverage: number | null;
  status: SeriesStatusValue | null;
  originalLanguage: string | null;
  originCountry: string | null;
  certificate: string | null;
  type: string | null;
};

export type CatalogSeasonFields = {
  tmdbId: number;
  name: string | null;
  seasonNumber: number;
  episodeCount: number;
  airDate: string | null;
};

export function firstOriginCountry(
  countries?: string[] | null,
): string | null {
  return countries?.[0] || null;
}

export function roundVoteAverage(
  value: number | null | undefined,
): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

export function pickMovieCertification(movie: TmdbMovie): TmdbReleaseDate | null {
  const releaseResults = movie.release_dates?.results ?? [];
  const releaseCountry =
    releaseResults.find((release) => release.iso_3166_1 === "IN") ??
    releaseResults.find(
      (release) => release.iso_3166_1 === movie.origin_country?.[0],
    );

  return releaseCountry?.release_dates?.[0] ?? null;
}

export function pickMovieCertificate(
  movie: TmdbMovie | MoviePayload,
): string | null {
  if ("certification" in movie && movie.certification) {
    return movie.certification.certification || null;
  }

  return pickMovieCertification(movie as TmdbMovie)?.certification || null;
}

export function pickSeriesCertificate(body: TmdbSeries): string | null {
  if (!body.content_ratings?.results) {
    return null;
  }

  const ratingCountry =
    body.content_ratings.results.find((rating) => rating.iso_3166_1 === "IN") ??
    body.content_ratings.results.find(
      (rating) => rating.iso_3166_1 === body.origin_country?.[0],
    );

  return ratingCountry?.rating ?? null;
}

export function genreTmdbIds(
  genres?: Array<{ id?: number }> | null,
): number[] {
  return (genres ?? [])
    .map((genre) => genre.id)
    .filter((id): id is number => typeof id === "number");
}

export function catalogSeasonsFromTmdb(
  seasonPayloads: TmdbSeries["seasons"],
): CatalogSeasonFields[] {
  if (!seasonPayloads || !Array.isArray(seasonPayloads)) {
    return [];
  }

  return seasonPayloads
    .filter(
      (
        season,
      ): season is typeof season & { id: number; season_number: number } =>
        season.id !== undefined && season.season_number !== undefined,
    )
    .map((season) => ({
      tmdbId: season.id,
      name: season.name || null,
      seasonNumber: season.season_number,
      episodeCount: season.episode_count || 0,
      airDate: season.air_date || null,
    }));
}

export function mapTmdbMovieToCatalog(
  movie: TmdbMovie | MoviePayload,
): CatalogMovieFields {
  const voteAverage =
    typeof movie.vote_average === "number" ? movie.vote_average : null;

  return {
    title: movie.title || "Unknown",
    posterPath: movie.poster_path || null,
    releaseDate: movie.release_date || null,
    voteAverage: roundVoteAverage(voteAverage),
    status: normalizeMovieStatus(movie.status),
    originalLanguage: movie.original_language || null,
    originCountry: firstOriginCountry(movie.origin_country),
    certificate: pickMovieCertificate(movie),
  };
}

export function mapTmdbSeriesToCatalog(body: TmdbSeries): CatalogSeriesFields {
  const voteAverage =
    typeof body.vote_average === "number" ? body.vote_average : null;

  return {
    name: body.name || "Unknown",
    posterPath: body.poster_path || null,
    firstAirDate: body.first_air_date || null,
    lastAirDate: body.last_air_date || null,
    totalNumberOfEpisodes: body.number_of_episodes || null,
    totalNumberOfSeasons: body.number_of_seasons || null,
    voteAverage: roundVoteAverage(voteAverage),
    status: normalizeSeriesStatus(body.status),
    originalLanguage: body.original_language || null,
    originCountry: Array.isArray(body.origin_country)
      ? firstOriginCountry(body.origin_country)
      : null,
    certificate: pickSeriesCertificate(body),
    type: body.type || null,
  };
}
