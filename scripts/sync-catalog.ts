import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAppError } from "@/lib/http/errors";
import {
  fetchTmdbMovieForCatalog,
  fetchTmdbMovieGenres,
  fetchTmdbSeriesForCatalog,
  fetchTmdbSeriesGenres,
} from "@/lib/tmdb/catalog-fetch";
import {
  applyCatalogSyncMutations,
  loadCatalogSyncSnapshot,
  previewUserSeriesReopens,
  type CatalogSyncSnapshot,
} from "@/repositories/catalog-sync";
import {
  applyGenreSyncMutations,
  loadGenreSyncSnapshot,
} from "@/repositories/genres";
import {
  DIFF_CSV_HEADERS,
  ERROR_CSV_HEADERS,
  diffCatalogMovie,
  diffCatalogSeries,
  diffRowRecord,
  emptyMutations,
  errorRowRecord,
  toCsv,
  userSeriesReopenDiffRows,
  type DiffRow,
  type ErrorRow,
} from "./lib/catalog-diff";
import {
  diffCatalogGenres,
  genreMutationWriteCount,
  mergeTmdbGenreLists,
  normalizeTmdbGenres,
} from "./lib/genre-sync";
import { TmdbRequestLimiter } from "./lib/tmdb-rate-limit";

type SyncMode = "dry-run" | "execute";

function parseMode(argv: string[]): SyncMode {
  const index = argv.indexOf("--mode");
  const value = index >= 0 ? argv[index + 1] : "dry-run";

  if (value !== "dry-run" && value !== "execute") {
    throw new Error(`Invalid --mode "${value}". Use dry-run or execute.`);
  }

  return value;
}

function databaseHost() {
  const url = process.env.TURSO_CONNECTION_URL;
  if (!url) {
    return "missing TURSO_CONNECTION_URL";
  }
  if (url.startsWith("file:")) {
    return url;
  }

  try {
    return new URL(url).host;
  } catch {
    return "(unparseable TURSO_CONNECTION_URL)";
  }
}

function catalogMutationWriteCount(
  mutations: ReturnType<typeof emptyMutations>,
) {
  return (
    mutations.movieUpdates.length +
    mutations.seriesUpdates.length +
    mutations.seasonUpdates.length +
    mutations.newSeasons.length +
    mutations.movieGenreLinks.length +
    mutations.seriesGenreLinks.length +
    mutations.movieGenreUnlinks.length +
    mutations.seriesGenreUnlinks.length
  );
}

function rememberNewGenres(
  snapshot: CatalogSyncSnapshot,
  inserts: Array<{ tmdbId: number }>,
) {
  for (const genre of inserts) {
    if (!snapshot.genreIdByTmdbId.has(genre.tmdbId)) {
      snapshot.genreIdByTmdbId.set(genre.tmdbId, 0);
    }
  }
}

async function mapWithProgress<T>(
  items: T[],
  label: string,
  mapper: (item: T) => Promise<void>,
) {
  const total = items.length;
  if (total === 0) {
    console.log(`[0/0] ${label}`);
    return;
  }

  let done = 0;
  const logEvery = Math.max(1, Math.min(25, Math.ceil(total / 20)));

  await Promise.all(
    items.map(async (item) => {
      try {
        await mapper(item);
      } finally {
        done += 1;
        if (done % logEvery === 0 || done === total) {
          console.log(`[${done}/${total}] ${label}`);
        }
      }
    }),
  );
}

function errorFromUnknown(
  entity: string,
  dbId: number,
  tmdbId: number,
  error: unknown,
): ErrorRow {
  const notFound = isAppError(error) && error.status === 404;
  return {
    entity,
    dbId: String(dbId),
    tmdbId: String(tmdbId),
    code: notFound ? "tmdb_not_found" : "tmdb_fetch_failed",
    message: error instanceof Error ? error.message : String(error),
  };
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const startedAt = new Date();
  const startedMs = Date.now();

  console.log(`Catalog sync mode: ${mode}`);
  console.log(`Database host: ${databaseHost()}`);

  const limiter = new TmdbRequestLimiter();
  const mutations = emptyMutations();
  const diffs: DiffRow[] = [];
  const errors: ErrorRow[] = [];
  let moviesWithDiffs = 0;
  let seriesWithDiffs = 0;
  let genreWritten = 0;
  let genreDbMs = 0;

  const tmdbStarted = Date.now();

  const [movieGenreList, seriesGenreList, genreSnapshot] = await Promise.all([
    limiter.run(() => fetchTmdbMovieGenres()),
    limiter.run(() => fetchTmdbSeriesGenres()),
    loadGenreSyncSnapshot(),
  ]);
  const tmdbGenres = mergeTmdbGenreLists(
    normalizeTmdbGenres(movieGenreList.genres),
    normalizeTmdbGenres(seriesGenreList.genres),
  );
  const { mutations: genreMutations, diffs: genreDiffs } = diffCatalogGenres({
    dbGenres: genreSnapshot.genres,
    tmdbGenres,
    usedGenreIds: genreSnapshot.usedGenreIds,
  });
  diffs.push(...genreDiffs);
  console.log(
    `Genres: TMDB ${tmdbGenres.length} unique (movie ${movieGenreList.genres?.length ?? 0}, series ${seriesGenreList.genres?.length ?? 0}); DB ${genreSnapshot.genres.length}; insert ${genreMutations.inserts.length}, update ${genreMutations.updates.length}, delete ${genreMutations.deletes.length}, skipped in-use ${genreMutations.skippedDeletes.length}`,
  );

  if (mode === "execute") {
    const genreDbStarted = Date.now();
    const genreWrite = await applyGenreSyncMutations(genreMutations);
    genreDbMs = Date.now() - genreDbStarted;
    genreWritten = genreWrite.written;
  }

  const loadStarted = Date.now();
  const snapshot = await loadCatalogSyncSnapshot();
  const loadMs = Date.now() - loadStarted;
  rememberNewGenres(snapshot, genreMutations.inserts);
  console.log(
    `Loaded ${snapshot.movies.length} movies, ${snapshot.series.length} series from DB in ${loadMs}ms`,
  );

  await mapWithProgress(snapshot.movies, "movies", async (movie) => {
    const titleDiffs: DiffRow[] = [];
    const titleErrors: ErrorRow[] = [];
    try {
      const tmdb = await limiter.run(() =>
        fetchTmdbMovieForCatalog(movie.tmdbId),
      );
      diffCatalogMovie({
        movie,
        tmdb,
        snapshot,
        mutations,
        diffs: titleDiffs,
        errors: titleErrors,
      });
    } catch (error) {
      titleErrors.push(errorFromUnknown("movie", movie.id, movie.tmdbId, error));
    }
    diffs.push(...titleDiffs);
    errors.push(...titleErrors);
    if (titleDiffs.length > 0) {
      moviesWithDiffs += 1;
    }
  });

  await mapWithProgress(snapshot.series, "series", async (show) => {
    const titleDiffs: DiffRow[] = [];
    const titleErrors: ErrorRow[] = [];
    try {
      const tmdb = await limiter.run(() =>
        fetchTmdbSeriesForCatalog(show.tmdbId),
      );
      diffCatalogSeries({
        show,
        tmdb,
        snapshot,
        mutations,
        diffs: titleDiffs,
        errors: titleErrors,
      });
    } catch (error) {
      titleErrors.push(errorFromUnknown("series", show.id, show.tmdbId, error));
    }
    diffs.push(...titleDiffs);
    errors.push(...titleErrors);
    if (titleDiffs.length > 0) {
      seriesWithDiffs += 1;
    }
  });

  const tmdbMs = Date.now() - tmdbStarted;
  const reopenPlans = await previewUserSeriesReopens(mutations, snapshot);
  diffs.push(...userSeriesReopenDiffRows(reopenPlans));
  const progressWouldInsert = diffs.filter(
    (row) => row.entity === "user_season_progress",
  ).length;
  const userSeriesWouldReopen = reopenPlans.length;
  const wouldWrite =
    catalogMutationWriteCount(mutations) +
    genreMutationWriteCount(genreMutations) +
    progressWouldInsert +
    userSeriesWouldReopen;

  const tempDir = path.join(process.cwd(), "temp");
  await mkdir(tempDir, { recursive: true });
  const stamp = startedAt.toISOString().replace(/:/g, "-");
  const diffsPath = path.join(tempDir, `catalog-sync-${stamp}-diffs.csv`);
  const errorsPath = path.join(tempDir, `catalog-sync-${stamp}-errors.csv`);
  const summaryPath = path.join(tempDir, `catalog-sync-${stamp}-summary.json`);

  await writeFile(
    diffsPath,
    toCsv(DIFF_CSV_HEADERS, diffs.map(diffRowRecord)),
  );
  await writeFile(
    errorsPath,
    toCsv(ERROR_CSV_HEADERS, errors.map(errorRowRecord)),
  );

  let dbMs = 0;
  let written = 0;
  let progressInserted = 0;
  let userSeriesReopened = 0;

  if (mode === "execute") {
    const dbStarted = Date.now();
    const result = await applyCatalogSyncMutations(mutations);
    dbMs = Date.now() - dbStarted;
    written = result.written + genreWritten;
    progressInserted = result.progressInserted;
    userSeriesReopened = result.userSeriesReopened;
  }

  const finishedAt = new Date();
  const totalMs = Date.now() - startedMs;
  const summary = {
    mode,
    database_host: databaseHost(),
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_ms: {
      total: totalMs,
      db_load: loadMs,
      tmdb: tmdbMs,
      db_write: dbMs + genreDbMs,
      genre_db_write: genreDbMs,
    },
    titles_scanned: {
      movies: snapshot.movies.length,
      series: snapshot.series.length,
    },
    titles_with_diffs: {
      movies: moviesWithDiffs,
      series: seriesWithDiffs,
    },
    would_write: wouldWrite,
    written: mode === "execute" ? written : 0,
    progress_rows: {
      would_insert: progressWouldInsert,
      inserted: progressInserted,
    },
    user_series_reopened: {
      would_reopen: userSeriesWouldReopen,
      reopened: userSeriesReopened,
    },
    mutation_counts: {
      genre_inserts: genreMutations.inserts.length,
      genre_updates: genreMutations.updates.length,
      genre_deletes: genreMutations.deletes.length,
      genre_deletes_skipped_in_use: genreMutations.skippedDeletes.length,
      movie_updates: mutations.movieUpdates.length,
      series_updates: mutations.seriesUpdates.length,
      season_updates: mutations.seasonUpdates.length,
      new_seasons: mutations.newSeasons.length,
      movie_genre_links: mutations.movieGenreLinks.length,
      series_genre_links: mutations.seriesGenreLinks.length,
      movie_genre_unlinks: mutations.movieGenreUnlinks.length,
      series_genre_unlinks: mutations.seriesGenreUnlinks.length,
    },
    tmdb: limiter.stats,
    error_count: errors.length,
    reports: {
      diffs: diffsPath,
      errors: errorsPath,
      summary: summaryPath,
    },
  };

  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(
    mode === "dry-run"
      ? `Dry run complete. Would write ${wouldWrite} row changes.`
      : `Execute complete. Wrote ${written} row changes.`,
  );
  console.log(
    `Timing: total ${totalMs}ms (tmdb ${tmdbMs}ms, db load ${loadMs}ms, db write ${dbMs + genreDbMs}ms)`,
  );
  console.log(
    `TMDB: ${limiter.stats.requests} requests, ${limiter.stats.retries} retries, ${limiter.stats.notFound} not found, throttle wait ${limiter.stats.throttleWaitMs}ms`,
  );
  console.log(`Diffs: ${diffsPath}`);
  console.log(`Errors: ${errorsPath}`);
  console.log(`Summary: ${summaryPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
