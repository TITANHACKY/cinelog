import type { DiffRow } from "./catalog-diff";

export type TmdbGenreEntry = {
  tmdbId: number;
  name: string;
};

export type GenreSyncMutations = {
  inserts: Array<{ tmdbId: number; name: string }>;
  updates: Array<{ id: number; tmdbId: number; name: string }>;
  deletes: Array<{ id: number; tmdbId: number; name: string }>;
  skippedDeletes: Array<{ id: number; tmdbId: number; name: string }>;
};

function stringify(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function emptyGenreMutations(): GenreSyncMutations {
  return {
    inserts: [],
    updates: [],
    deletes: [],
    skippedDeletes: [],
  };
}

export function genreMutationWriteCount(mutations: GenreSyncMutations) {
  return (
    mutations.inserts.length + mutations.updates.length + mutations.deletes.length
  );
}

export function normalizeTmdbGenres(
  genres?: Array<{ id?: number; name?: string }> | null,
): TmdbGenreEntry[] {
  const entries: TmdbGenreEntry[] = [];

  for (const genre of genres ?? []) {
    const name = genre.name?.trim();
    if (typeof genre.id !== "number" || genre.id <= 0 || !name) {
      continue;
    }
    entries.push({ tmdbId: genre.id, name });
  }

  return entries;
}

export function mergeTmdbGenreLists(
  movieGenres: TmdbGenreEntry[],
  seriesGenres: TmdbGenreEntry[],
): TmdbGenreEntry[] {
  const byTmdbId = new Map<number, string>();

  for (const genre of [...movieGenres, ...seriesGenres]) {
    if (!byTmdbId.has(genre.tmdbId)) {
      byTmdbId.set(genre.tmdbId, genre.name);
    }
  }

  return [...byTmdbId.entries()].map(([tmdbId, name]) => ({ tmdbId, name }));
}

function pushGenreDiff(
  diffs: DiffRow[],
  dbId: number | string,
  tmdbId: number,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  action: DiffRow["action"],
) {
  diffs.push({
    entity: "genre",
    dbId: stringify(dbId),
    tmdbId: stringify(tmdbId),
    field,
    oldValue: stringify(oldValue),
    newValue: stringify(newValue),
    action,
  });
}

export function diffCatalogGenres(input: {
  dbGenres: Array<{ id: number; tmdbId: number; name: string }>;
  tmdbGenres: TmdbGenreEntry[];
  usedGenreIds: Set<number>;
}): { mutations: GenreSyncMutations; diffs: DiffRow[] } {
  const mutations = emptyGenreMutations();
  const diffs: DiffRow[] = [];
  const dbByTmdbId = new Map(
    input.dbGenres.map((genre) => [genre.tmdbId, genre]),
  );
  const incomingIds = new Set<number>();

  for (const genre of input.tmdbGenres) {
    incomingIds.add(genre.tmdbId);
    const current = dbByTmdbId.get(genre.tmdbId);

    if (!current) {
      mutations.inserts.push({ tmdbId: genre.tmdbId, name: genre.name });
      pushGenreDiff(diffs, "", genre.tmdbId, "name", "", genre.name, "insert");
      continue;
    }

    if (current.name !== genre.name) {
      mutations.updates.push({
        id: current.id,
        tmdbId: genre.tmdbId,
        name: genre.name,
      });
      pushGenreDiff(
        diffs,
        current.id,
        genre.tmdbId,
        "name",
        current.name,
        genre.name,
        "update",
      );
    }
  }

  for (const genre of input.dbGenres) {
    if (incomingIds.has(genre.tmdbId)) {
      continue;
    }

    if (input.usedGenreIds.has(genre.id)) {
      mutations.skippedDeletes.push(genre);
      continue;
    }

    mutations.deletes.push(genre);
    pushGenreDiff(diffs, genre.id, genre.tmdbId, "name", genre.name, "", "delete");
  }

  return { mutations, diffs };
}
