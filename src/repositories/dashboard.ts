import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
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
import type { LibraryMovie, LibrarySeries } from "@/lib/types";
import type { DiscoverSeed } from "@/lib/discover/plan";

export async function findContinueWatchingTitles(
  userId: number,
  limit = 20,
): Promise<Array<LibraryMovie | LibrarySeries>> {
  const db = getDb();

  const [movieRows, seriesRows] = await Promise.all([
    db
      .select({
        id: movies.id,
        tmdbId: movies.tmdbId,
        watchStatus: userMovies.watchStatus,
        impression: userMovies.impression,
        createdAt: userMovies.createdAt,
        updatedAt: userMovies.updatedAt,
        lastWatchedAt: userMovies.lastWatchedAt,
        completedAt: userMovies.completedAt,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseDate: movies.releaseDate,
        voteAverage: movies.voteAverage,
        status: movies.status,
        originalLanguage: movies.originalLanguage,
        originCountry: movies.originCountry,
        certificate: movies.certificate,
      })
      .from(userMovies)
      .innerJoin(movies, eq(userMovies.movieId, movies.id))
      .where(and(eq(userMovies.userId, userId), eq(userMovies.watchStatus, 1)))
      .orderBy(
        desc(
          sql`coalesce(${userMovies.lastWatchedAt}, ${userMovies.updatedAt}, ${userMovies.createdAt})`,
        ),
      )
      .limit(limit),

    db
      .select({
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
      })
      .from(userSeries)
      .innerJoin(series, eq(userSeries.seriesId, series.id))
      .where(and(eq(userSeries.userId, userId), eq(userSeries.watchStatus, 1)))
      .orderBy(
        desc(
          sql`coalesce(${userSeries.lastWatchedAt}, ${userSeries.updatedAt}, ${userSeries.createdAt})`,
        ),
      )
      .limit(limit),
  ]);

  const movieCatalogIds = movieRows.map((m) => m.id);
  const seriesCatalogIds = seriesRows.map((s) => s.id);

  const followUpQueries: SqliteBatchQuery[] = [];

  if (movieCatalogIds.length > 0) {
    followUpQueries.push(
      db
        .select({
          parentId: moviesToGenres.movieId,
          genreName: genres.name,
        })
        .from(moviesToGenres)
        .innerJoin(genres, eq(moviesToGenres.genreId, genres.id))
        .where(inArray(moviesToGenres.movieId, movieCatalogIds)),
    );
  }

  if (seriesCatalogIds.length > 0) {
    followUpQueries.push(
      db
        .select({
          parentId: seriesToGenres.seriesId,
          genreName: genres.name,
        })
        .from(seriesToGenres)
        .innerJoin(genres, eq(seriesToGenres.genreId, genres.id))
        .where(inArray(seriesToGenres.seriesId, seriesCatalogIds)),
    );
    followUpQueries.push(
      db
        .select({
          tmdbId: series.tmdbId,
          seasonNumber: seasons.seasonNumber,
          episodeCount: seasons.episodeCount,
          episodesWatched: sql<number>`coalesce(${userSeasonProgress.episodesWatched}, 0)`,
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
            inArray(series.id, seriesCatalogIds),
          ),
        ),
    );
  }

  const followUpResults =
    followUpQueries.length > 0 ? await db.batch(asBatch(followUpQueries)) : [];

  let queryIndex = 0;
  const movieGenreMap = new Map<number, string[]>();
  if (movieCatalogIds.length > 0) {
    const rows = (followUpResults[queryIndex++] ?? []) as Array<{
      parentId: number;
      genreName: string;
    }>;
    for (const r of rows) {
      const list = movieGenreMap.get(r.parentId) ?? [];
      list.push(r.genreName);
      movieGenreMap.set(r.parentId, list);
    }
  }

  const seriesGenreMap = new Map<number, string[]>();
  const seasonsBySeries = new Map<number, LibrarySeries["seasons_info"]>();
  if (seriesCatalogIds.length > 0) {
    const genreRows = (followUpResults[queryIndex++] ?? []) as Array<{
      parentId: number;
      genreName: string;
    }>;
    for (const r of genreRows) {
      const list = seriesGenreMap.get(r.parentId) ?? [];
      list.push(r.genreName);
      seriesGenreMap.set(r.parentId, list);
    }

    const seasonRows = (followUpResults[queryIndex++] ?? []) as Array<{
      tmdbId: number;
      seasonNumber: number;
      episodeCount: number;
      episodesWatched: number;
      airDate: string | null;
    }>;
    for (const s of seasonRows) {
      const list = seasonsBySeries.get(s.tmdbId) ?? [];
      list.push({
        season_number: s.seasonNumber,
        episode_count: s.episodeCount,
        episodes_watched: s.episodesWatched,
        air_date: s.airDate,
      });
      seasonsBySeries.set(s.tmdbId, list);
    }
  }

  const mappedMovies: LibraryMovie[] = movieRows.map((movie) => ({
    tmdb_id: movie.tmdbId,
    watch_status: movie.watchStatus,
    impression: movie.impression,
    created_at: movie.createdAt,
    updated_at: movie.updatedAt,
    last_watched_at: movie.lastWatchedAt,
    completed_at: movie.completedAt,
    title: movie.title,
    poster_path: movie.posterPath,
    release_date: movie.releaseDate,
    vote_average: movie.voteAverage,
    status: movie.status,
    original_language: movie.originalLanguage,
    origin_country: movie.originCountry,
    certificate: movie.certificate,
    genres: movieGenreMap.get(movie.id) ?? [],
  }));

  const mappedSeries: LibrarySeries[] = seriesRows.map((show) => ({
    tmdb_id: show.tmdbId,
    watch_status: show.watchStatus,
    impression: show.impression,
    created_at: show.createdAt,
    updated_at: show.updatedAt,
    last_watched_at: show.lastWatchedAt,
    completed_at: show.completedAt,
    vote_average: show.voteAverage,
    name: show.name,
    first_air_date: show.firstAirDate,
    last_air_date: show.lastAirDate,
    total_number_of_episodes: show.totalNumberOfEpisodes,
    total_number_of_seasons: show.totalNumberOfSeasons,
    total_number_of_seasons_watched: show.totalNumberOfSeasonsWatched,
    total_number_of_episodes_watched: show.totalNumberOfEpisodesWatched,
    poster_path: show.posterPath,
    status: show.status,
    original_language: show.originalLanguage,
    origin_country: show.originCountry,
    certificate: show.certificate,
    genres: seriesGenreMap.get(show.id) ?? [],
    seasons_info: seasonsBySeries.get(show.tmdbId) ?? [],
  }));

  const getItemTime = (item: LibraryMovie | LibrarySeries): number => {
    const raw = item.last_watched_at ?? item.updated_at ?? item.created_at;
    return raw ? Number(raw) : 0;
  };

  const combined = [...mappedMovies, ...mappedSeries].sort(
    (left, right) => getItemTime(right) - getItemTime(left),
  );

  return combined.slice(0, limit);
}

// Recently completed titles the user didn't dislike seed the
// "Because you watched" rows.
export async function findRecommendationSeeds(
  userId: number,
  limit: number,
): Promise<DiscoverSeed[]> {
  const db = getDb();
  const movieAt = sql<string>`coalesce(${userMovies.completedAt}, ${userMovies.updatedAt}, ${userMovies.createdAt})`;
  const seriesAt = sql<string>`coalesce(${userSeries.completedAt}, ${userSeries.updatedAt}, ${userSeries.createdAt})`;

  const [movieRows, seriesRows] = await Promise.all([
    db
      .select({ tmdbId: movies.tmdbId, title: movies.title, at: movieAt })
      .from(userMovies)
      .innerJoin(movies, eq(userMovies.movieId, movies.id))
      .where(
        and(
          eq(userMovies.userId, userId),
          eq(userMovies.watchStatus, 2),
          or(
            isNull(userMovies.impression),
            inArray(userMovies.impression, [1, 2]),
          ),
        ),
      )
      .orderBy(desc(movieAt))
      .limit(limit),
    db
      .select({ tmdbId: series.tmdbId, title: series.name, at: seriesAt })
      .from(userSeries)
      .innerJoin(series, eq(userSeries.seriesId, series.id))
      .where(
        and(
          eq(userSeries.userId, userId),
          eq(userSeries.watchStatus, 2),
          or(
            isNull(userSeries.impression),
            inArray(userSeries.impression, [1, 2]),
          ),
        ),
      )
      .orderBy(desc(seriesAt))
      .limit(limit),
  ]);

  const candidates = [
    ...movieRows.map((row) => ({ ...row, mediaType: "movie" as const })),
    ...seriesRows.map((row) => ({ ...row, mediaType: "series" as const })),
  ].sort((left, right) => Number(right.at ?? 0) - Number(left.at ?? 0));

  return candidates.slice(0, limit).map((row) => ({
    tmdbId: row.tmdbId,
    mediaType: row.mediaType,
    title: row.title,
  }));
}
