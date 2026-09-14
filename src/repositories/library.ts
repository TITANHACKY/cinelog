import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import {
  genres,
  movies,
  moviesToGenres,
  seasons,
  series,
  seriesToGenres,
  userMovies,
  userSeasonProgress,
  userSeries,
} from "@/db/schema";
import type { LibraryQueryInput } from "@/lib/validations/library";

export type UserMovieRow = {
  id: number;
  tmdbId: number;
  watchStatus: number;
  impression: number | null;
  createdAt: string;
  updatedAt: string | null;
  completedAt: string | null;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  status: string | null;
  originalLanguage: string | null;
  originCountry: string | null;
  certificate: string | null;
  genres: string[];
};

export type UserSeriesRow = {
  id: number;
  tmdbId: number;
  watchStatus: number;
  impression: number | null;
  createdAt: string;
  updatedAt: string | null;
  lastWatchedAt: string | null;
  completedAt: string | null;
  name: string;
  firstAirDate: string | null;
  lastAirDate: string | null;
  totalNumberOfEpisodes: number | null;
  totalNumberOfSeasons: number | null;
  totalNumberOfEpisodesWatched: number | null;
  totalNumberOfSeasonsWatched: number | null;
  posterPath: string | null;
  voteAverage: number | null;
  originalLanguage: string | null;
  originCountry: string | null;
  certificate: string | null;
  status: string | null;
  genres: string[];
};

export type UserSeasonRow = {
  tmdbId: number;
  seasonNumber: number;
  episodeCount: number;
  episodesWatched: number;
  airDate: string | null;
};

type MoviePageRow = Omit<UserMovieRow, "genres">;
type SeriesPageRow = Omit<UserSeriesRow, "genres">;
type GenreRow = { parentId: number; genreName: string };

function attachGenres<T extends { id: number }>(
  rows: T[],
  genreRows: GenreRow[],
): (T & { genres: string[] })[] {
  const genreMap = new Map<number, string[]>();
  for (const row of genreRows) {
    const list = genreMap.get(row.parentId) || [];
    list.push(row.genreName);
    genreMap.set(row.parentId, list);
  }

  return rows.map((row) => ({
    ...row,
    genres: genreMap.get(row.id) || [],
  }));
}

function asCount(rows: { value: number }[] | undefined) {
  return Number(rows?.[0]?.value ?? 0);
}

export async function listLibraryRows(
  userId: number,
  query: LibraryQueryInput,
): Promise<{
  movies: UserMovieRow[];
  series: UserSeriesRow[];
  seasons: UserSeasonRow[];
  movieCount: number;
  seriesCount: number;
}> {
  const db = getDb();
  const includeMovies = query.type === "movie";
  const includeSeries = query.type === "series";

  const movieSelect = {
    id: movies.id,
    tmdbId: movies.tmdbId,
    watchStatus: userMovies.watchStatus,
    impression: userMovies.impression,
    createdAt: userMovies.createdAt,
    updatedAt: userMovies.updatedAt,
    completedAt: userMovies.completedAt,
    title: movies.title,
    posterPath: movies.posterPath,
    releaseDate: movies.releaseDate,
    voteAverage: movies.voteAverage,
    status: movies.status,
    originalLanguage: movies.originalLanguage,
    originCountry: movies.originCountry,
    certificate: movies.certificate,
  };

  const seriesSelect = {
    id: series.id,
    tmdbId: series.tmdbId,
    watchStatus: userSeries.watchStatus,
    impression: userSeries.impression,
    createdAt: userSeries.createdAt,
    updatedAt: userSeries.updatedAt,
    lastWatchedAt: userSeries.lastWatchedAt,
    completedAt: userSeries.completedAt,
    name: series.name,
    firstAirDate: series.firstAirDate,
    lastAirDate: series.lastAirDate,
    totalNumberOfEpisodes: series.totalNumberOfEpisodes,
    totalNumberOfSeasons: series.totalNumberOfSeasons,
    totalNumberOfSeasonsWatched: userSeries.totalNumberOfSeasonsWatched,
    totalNumberOfEpisodesWatched: userSeries.totalNumberOfEpisodesWatched,
    posterPath: series.posterPath,
    voteAverage: series.voteAverage,
    status: series.status,
    originalLanguage: series.originalLanguage,
    originCountry: series.originCountry,
    certificate: series.certificate,
  };

  const pageQueries: SqliteBatchQuery[] = [
    db
      .select({ value: count() })
      .from(userMovies)
      .where(eq(userMovies.userId, userId)),
    db
      .select({ value: count() })
      .from(userSeries)
      .where(eq(userSeries.userId, userId)),
  ];

  if (includeMovies) {
    pageQueries.push(
      db
        .select(movieSelect)
        .from(userMovies)
        .innerJoin(movies, eq(userMovies.movieId, movies.id))
        .where(eq(userMovies.userId, userId))
        .orderBy(desc(userMovies.createdAt))
        .limit(query.limit)
        .offset(query.offset),
    );
  }

  if (includeSeries) {
    pageQueries.push(
      db
        .select(seriesSelect)
        .from(userSeries)
        .innerJoin(series, eq(userSeries.seriesId, series.id))
        .where(eq(userSeries.userId, userId))
        .orderBy(desc(userSeries.createdAt))
        .limit(query.limit)
        .offset(query.offset),
    );
  }

  const pageResults = await db.batch(asBatch(pageQueries));
  const movieCount = asCount(pageResults[0] as { value: number }[]);
  const seriesCount = asCount(pageResults[1] as { value: number }[]);

  const userMovieRows = includeMovies
    ? (pageResults[2] as MoviePageRow[])
    : [];
  const userSeriesRows = includeSeries
    ? (pageResults[includeMovies ? 3 : 2] as SeriesPageRow[])
    : [];

  const catalogMovieIds = userMovieRows.map((movie) => movie.id);
  const catalogSeriesIds = userSeriesRows.map((show) => show.id);
  const followUp: SqliteBatchQuery[] = [];

  if (catalogMovieIds.length > 0) {
    followUp.push(
      db
        .select({
          parentId: moviesToGenres.movieId,
          genreName: genres.name,
        })
        .from(moviesToGenres)
        .innerJoin(genres, eq(moviesToGenres.genreId, genres.id))
        .where(inArray(moviesToGenres.movieId, catalogMovieIds)),
    );
  }

  if (catalogSeriesIds.length > 0) {
    followUp.push(
      db
        .select({
          parentId: seriesToGenres.seriesId,
          genreName: genres.name,
        })
        .from(seriesToGenres)
        .innerJoin(genres, eq(seriesToGenres.genreId, genres.id))
        .where(inArray(seriesToGenres.seriesId, catalogSeriesIds)),
    );
    followUp.push(
      db
        .select({
          tmdbId: series.tmdbId,
          seasonNumber: seasons.seasonNumber,
          episodeCount: seasons.episodeCount,
          episodesWatched: userSeasonProgress.episodesWatched,
          airDate: seasons.airDate,
        })
        .from(userSeries)
        .innerJoin(series, eq(userSeries.seriesId, series.id))
        .innerJoin(seasons, eq(seasons.seriesId, series.id))
        .leftJoin(
          userSeasonProgress,
          and(
            eq(userSeasonProgress.userSeriesId, userSeries.id),
            eq(userSeasonProgress.seasonId, seasons.id),
          ),
        )
        .where(
          and(
            eq(userSeries.userId, userId),
            inArray(series.id, catalogSeriesIds),
          ),
        )
        .orderBy(asc(series.tmdbId), asc(seasons.seasonNumber)),
    );
  }

  let movieGenres: GenreRow[] = [];
  let seriesGenres: GenreRow[] = [];
  let seasonRows: UserSeasonRow[] = [];

  if (followUp.length > 0) {
    const followResults = await db.batch(asBatch(followUp));
    let followIndex = 0;

    if (catalogMovieIds.length > 0) {
      movieGenres = followResults[followIndex] as GenreRow[];
      followIndex += 1;
    }

    if (catalogSeriesIds.length > 0) {
      seriesGenres = followResults[followIndex] as GenreRow[];
      followIndex += 1;
      seasonRows = (followResults[followIndex] as UserSeasonRow[]).map(
        (row) => ({
          ...row,
          episodesWatched: row.episodesWatched ?? 0,
        }),
      );
    }
  }

  return {
    movies: attachGenres(userMovieRows, movieGenres),
    series: attachGenres(userSeriesRows, seriesGenres),
    seasons: seasonRows,
    movieCount,
    seriesCount,
  };
}
