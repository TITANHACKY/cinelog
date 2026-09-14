import type { Movie, Season, Series } from "@/db/schema";
import {
  catalogSeasonsFromTmdb,
  genreTmdbIds,
  mapTmdbMovieToCatalog,
  mapTmdbSeriesToCatalog,
  roundVoteAverage,
  type CatalogMovieFields,
  type CatalogSeasonFields,
  type CatalogSeriesFields,
} from "@/lib/tmdb/catalog-fields";
import type { TmdbMovie, TmdbSeries } from "@/lib/types";
import type {
  CatalogSyncMutations,
  CatalogSyncSnapshot,
} from "@/repositories/catalog-sync";

export type DiffRow = {
  entity: string;
  dbId: string;
  tmdbId: string;
  field: string;
  oldValue: string;
  newValue: string;
  action: "update" | "insert" | "delete";
};

export type ErrorRow = {
  entity: string;
  dbId: string;
  tmdbId: string;
  code: string;
  message: string;
};

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function stringify(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function valuesEqual(left: unknown, right: unknown) {
  if (left == null && right == null) {
    return true;
  }
  return left === right;
}

export function toCsv(headers: string[], rows: Array<Record<string, string>>) {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function diffRowRecord(row: DiffRow) {
  return {
    entity: row.entity,
    db_id: row.dbId,
    tmdb_id: row.tmdbId,
    field: row.field,
    old_value: row.oldValue,
    new_value: row.newValue,
    action: row.action,
  };
}

export function errorRowRecord(row: ErrorRow) {
  return {
    entity: row.entity,
    db_id: row.dbId,
    tmdb_id: row.tmdbId,
    code: row.code,
    message: row.message,
  };
}

function pushFieldDiff(
  diffs: DiffRow[],
  entity: string,
  dbId: number | string,
  tmdbId: number,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  action: "update" | "insert" | "delete" = "update",
) {
  diffs.push({
    entity,
    dbId: stringify(dbId),
    tmdbId: stringify(tmdbId),
    field,
    oldValue: stringify(oldValue),
    newValue: stringify(newValue),
    action,
  });
}

function collectChangedFields<T extends object>(
  current: T,
  next: T,
  keys: Array<keyof T>,
  compare: Partial<Record<keyof T, (left: unknown, right: unknown) => boolean>> = {},
) {
  const changed: Partial<T> = {};
  const fieldDiffs: Array<{ field: string; oldValue: unknown; newValue: unknown }> =
    [];

  for (const key of keys) {
    const left = current[key];
    const right = next[key];
    const equal = compare[key]
      ? compare[key]!(left, right)
      : valuesEqual(left, right);
    if (!equal) {
      changed[key] = right;
      fieldDiffs.push({
        field: String(key),
        oldValue: left,
        newValue: right,
      });
    }
  }

  return { changed, fieldDiffs };
}

function voteEquals(left: unknown, right: unknown) {
  return valuesEqual(roundVoteAverage(left as number | null), right);
}

const MOVIE_KEYS: Array<keyof CatalogMovieFields> = [
  "title",
  "posterPath",
  "releaseDate",
  "voteAverage",
  "status",
  "originalLanguage",
  "originCountry",
  "certificate",
];

const SERIES_KEYS: Array<keyof CatalogSeriesFields> = [
  "name",
  "posterPath",
  "firstAirDate",
  "lastAirDate",
  "totalNumberOfEpisodes",
  "totalNumberOfSeasons",
  "voteAverage",
  "status",
  "originalLanguage",
  "originCountry",
  "certificate",
  "type",
];

const SEASON_KEYS: Array<keyof CatalogSeasonFields> = [
  "tmdbId",
  "name",
  "episodeCount",
  "airDate",
];

function currentMovieFields(movie: Movie): CatalogMovieFields {
  return {
    title: movie.title,
    posterPath: movie.posterPath,
    releaseDate: movie.releaseDate,
    voteAverage: movie.voteAverage,
    status: movie.status as CatalogMovieFields["status"],
    originalLanguage: movie.originalLanguage,
    originCountry: movie.originCountry,
    certificate: movie.certificate,
  };
}

function currentSeriesFields(show: Series): CatalogSeriesFields {
  return {
    name: show.name,
    posterPath: show.posterPath,
    firstAirDate: show.firstAirDate,
    lastAirDate: show.lastAirDate,
    totalNumberOfEpisodes: show.totalNumberOfEpisodes,
    totalNumberOfSeasons: show.totalNumberOfSeasons,
    voteAverage: show.voteAverage,
    status: show.status as CatalogSeriesFields["status"],
    originalLanguage: show.originalLanguage,
    originCountry: show.originCountry,
    certificate: show.certificate,
    type: show.type,
  };
}

function currentSeasonFields(season: Season): CatalogSeasonFields {
  return {
    tmdbId: season.tmdbId,
    name: season.name,
    seasonNumber: season.seasonNumber,
    episodeCount: season.episodeCount,
    airDate: season.airDate,
  };
}

function diffGenreIds(
  current: Set<number> | undefined,
  incoming: number[],
  knownTmdbIds: Map<number, number>,
) {
  const currentIds = current ?? new Set<number>();
  const incomingSet = new Set<number>();
  const missing: number[] = [];
  const unknown: number[] = [];

  for (const tmdbId of incoming) {
    if (!knownTmdbIds.has(tmdbId)) {
      unknown.push(tmdbId);
      continue;
    }
    incomingSet.add(tmdbId);
    if (!currentIds.has(tmdbId)) {
      missing.push(tmdbId);
    }
  }

  const extra: number[] = [];
  for (const tmdbId of currentIds) {
    if (!incomingSet.has(tmdbId)) {
      extra.push(tmdbId);
    }
  }

  return { missing, extra, unknown };
}

export function emptyMutations(): CatalogSyncMutations {
  return {
    movieUpdates: [],
    seriesUpdates: [],
    seasonUpdates: [],
    newSeasons: [],
    movieGenreLinks: [],
    seriesGenreLinks: [],
    movieGenreUnlinks: [],
    seriesGenreUnlinks: [],
  };
}

export function diffCatalogMovie(input: {
  movie: Movie;
  tmdb: TmdbMovie;
  snapshot: CatalogSyncSnapshot;
  mutations: CatalogSyncMutations;
  diffs: DiffRow[];
  errors: ErrorRow[];
}) {
  const mapped = mapTmdbMovieToCatalog(input.tmdb);
  const { changed, fieldDiffs } = collectChangedFields(
    currentMovieFields(input.movie),
    mapped,
    MOVIE_KEYS,
    { voteAverage: voteEquals },
  );

  if (fieldDiffs.length > 0) {
    input.mutations.movieUpdates.push({
      id: input.movie.id,
      values: changed,
    });
    for (const field of fieldDiffs) {
      pushFieldDiff(
        input.diffs,
        "movie",
        input.movie.id,
        input.movie.tmdbId,
        field.field,
        field.oldValue,
        field.newValue,
      );
    }
  }

  const { missing, extra, unknown } = diffGenreIds(
    input.snapshot.movieGenreTmdbIds.get(input.movie.id),
    genreTmdbIds(input.tmdb.genres),
    input.snapshot.genreIdByTmdbId,
  );

  if (missing.length > 0) {
    input.mutations.movieGenreLinks.push({
      movieId: input.movie.id,
      genreTmdbIds: missing,
    });
    for (const genreTmdbId of missing) {
      pushFieldDiff(
        input.diffs,
        "movie_genre",
        input.movie.id,
        input.movie.tmdbId,
        "genre_tmdb_id",
        "",
        genreTmdbId,
        "insert",
      );
    }
  }

  const extraMovieGenreIds = extra
    .map((tmdbId) => input.snapshot.genreIdByTmdbId.get(tmdbId))
    .filter((id): id is number => typeof id === "number");

  if (extraMovieGenreIds.length > 0) {
    input.mutations.movieGenreUnlinks.push({
      movieId: input.movie.id,
      genreIds: extraMovieGenreIds,
    });
    for (const genreTmdbId of extra) {
      pushFieldDiff(
        input.diffs,
        "movie_genre",
        input.movie.id,
        input.movie.tmdbId,
        "genre_tmdb_id",
        genreTmdbId,
        "",
        "delete",
      );
    }
  }

  for (const genreTmdbId of unknown) {
    input.errors.push({
      entity: "movie_genre",
      dbId: stringify(input.movie.id),
      tmdbId: stringify(input.movie.tmdbId),
      code: "unknown_genre",
      message: `TMDB genre ${genreTmdbId} is not in the local genres table`,
    });
  }
}

export function diffCatalogSeries(input: {
  show: Series;
  tmdb: TmdbSeries;
  snapshot: CatalogSyncSnapshot;
  mutations: CatalogSyncMutations;
  diffs: DiffRow[];
  errors: ErrorRow[];
}) {
  const mapped = mapTmdbSeriesToCatalog(input.tmdb);
  const { changed, fieldDiffs } = collectChangedFields(
    currentSeriesFields(input.show),
    mapped,
    SERIES_KEYS,
    { voteAverage: voteEquals },
  );

  if (fieldDiffs.length > 0) {
    input.mutations.seriesUpdates.push({
      id: input.show.id,
      values: changed,
    });
    for (const field of fieldDiffs) {
      pushFieldDiff(
        input.diffs,
        "series",
        input.show.id,
        input.show.tmdbId,
        field.field,
        field.oldValue,
        field.newValue,
      );
    }
  }

  const { missing, extra, unknown } = diffGenreIds(
    input.snapshot.seriesGenreTmdbIds.get(input.show.id),
    genreTmdbIds(input.tmdb.genres),
    input.snapshot.genreIdByTmdbId,
  );

  if (missing.length > 0) {
    input.mutations.seriesGenreLinks.push({
      seriesId: input.show.id,
      genreTmdbIds: missing,
    });
    for (const genreTmdbId of missing) {
      pushFieldDiff(
        input.diffs,
        "series_genre",
        input.show.id,
        input.show.tmdbId,
        "genre_tmdb_id",
        "",
        genreTmdbId,
        "insert",
      );
    }
  }

  const extraSeriesGenreIds = extra
    .map((tmdbId) => input.snapshot.genreIdByTmdbId.get(tmdbId))
    .filter((id): id is number => typeof id === "number");

  if (extraSeriesGenreIds.length > 0) {
    input.mutations.seriesGenreUnlinks.push({
      seriesId: input.show.id,
      genreIds: extraSeriesGenreIds,
    });
    for (const genreTmdbId of extra) {
      pushFieldDiff(
        input.diffs,
        "series_genre",
        input.show.id,
        input.show.tmdbId,
        "genre_tmdb_id",
        genreTmdbId,
        "",
        "delete",
      );
    }
  }

  for (const genreTmdbId of unknown) {
    input.errors.push({
      entity: "series_genre",
      dbId: stringify(input.show.id),
      tmdbId: stringify(input.show.tmdbId),
      code: "unknown_genre",
      message: `TMDB genre ${genreTmdbId} is not in the local genres table`,
    });
  }

  const existingSeasons = input.snapshot.seasonsBySeriesId.get(input.show.id) ?? [];
  const existingByNumber = new Map(
    existingSeasons.map((season) => [season.seasonNumber, season]),
  );
  const tmdbSeasons = catalogSeasonsFromTmdb(input.tmdb.seasons);
  const userSeriesIds =
    input.snapshot.userSeriesIdsBySeriesId.get(input.show.id) ?? [];

  for (const season of tmdbSeasons) {
    const current = existingByNumber.get(season.seasonNumber);
    if (!current) {
      input.mutations.newSeasons.push({
        ...season,
        seriesId: input.show.id,
      });
      pushFieldDiff(
        input.diffs,
        "season",
        "",
        season.tmdbId,
        "season_number",
        "",
        season.seasonNumber,
        "insert",
      );
      for (const userSeriesId of userSeriesIds) {
        pushFieldDiff(
          input.diffs,
          "user_season_progress",
          userSeriesId,
          season.tmdbId,
          "season_id",
          "",
          season.seasonNumber,
          "insert",
        );
      }
      continue;
    }

    const seasonDiff = collectChangedFields(
      currentSeasonFields(current),
      season,
      SEASON_KEYS,
    );
    if (seasonDiff.fieldDiffs.length === 0) {
      continue;
    }

    input.mutations.seasonUpdates.push({
      id: current.id,
      values: seasonDiff.changed,
    });
    for (const field of seasonDiff.fieldDiffs) {
      pushFieldDiff(
        input.diffs,
        "season",
        current.id,
        season.tmdbId,
        field.field,
        field.oldValue,
        field.newValue,
      );
    }
  }
}

export const DIFF_CSV_HEADERS = [
  "entity",
  "db_id",
  "tmdb_id",
  "field",
  "old_value",
  "new_value",
  "action",
];

export const ERROR_CSV_HEADERS = ["entity", "db_id", "tmdb_id", "code", "message"];
