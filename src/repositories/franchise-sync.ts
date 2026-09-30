import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { franchises, movies, type Franchise } from "@/db/schema";
import { nowUnixSeconds } from "@/lib/media/display";
import {
  linkMovieToFranchise,
  unlinkMoviesFromFranchise,
  upsertCatalogMovieFromCollectionPart,
} from "@/repositories/catalog";
import {
  listAllFranchises,
  listMoviesByFranchiseIds,
  upsertFranchise,
} from "@/repositories/franchises";
import type { TmdbCollection, TmdbCollectionPart } from "@/lib/types";

export type FranchiseSyncSnapshot = {
  franchises: Franchise[];
  moviesByFranchiseId: Map<number, Array<{ id: number; tmdbId: number }>>;
};

export type FranchiseMetadataUpdate = {
  id: number;
  values: {
    name: string;
    overview: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    numberOfParts: number;
  };
};

export type FranchiseMovieLink = {
  franchiseDbId: number;
  part: TmdbCollectionPart;
};

export type FranchiseMovieUnlink = {
  franchiseDbId: number;
  movieDbId: number;
  movieTmdbId: number;
};

export type FranchiseSyncMutations = {
  metadataUpdates: FranchiseMetadataUpdate[];
  movieLinks: FranchiseMovieLink[];
  movieUnlinks: FranchiseMovieUnlink[];
};

export function emptyFranchiseSyncMutations(): FranchiseSyncMutations {
  return {
    metadataUpdates: [],
    movieLinks: [],
    movieUnlinks: [],
  };
}

export async function loadFranchiseSyncSnapshot(): Promise<FranchiseSyncSnapshot> {
  const franchiseRows = await listAllFranchises();
  const franchiseDbIds = franchiseRows.map((row) => row.id);
  const linkedMovies = await listMoviesByFranchiseIds(franchiseDbIds);

  const moviesByFranchiseId = new Map<
    number,
    Array<{ id: number; tmdbId: number }>
  >();

  for (const movie of linkedMovies) {
    if (!movie.franchiseId) {
      continue;
    }

    const current = moviesByFranchiseId.get(movie.franchiseId) ?? [];
    current.push({ id: movie.id, tmdbId: movie.tmdbId });
    moviesByFranchiseId.set(movie.franchiseId, current);
  }

  return {
    franchises: franchiseRows,
    moviesByFranchiseId,
  };
}

export function diffFranchiseCollection(input: {
  franchise: Franchise;
  collection: TmdbCollection;
  snapshot: FranchiseSyncSnapshot;
  mutations: FranchiseSyncMutations;
}) {
  const { franchise, collection, snapshot, mutations } = input;
  const linkedMovies = snapshot.moviesByFranchiseId.get(franchise.id) ?? [];
  const linkedByTmdbId = new Map(
    linkedMovies.map((movie) => [movie.tmdbId, movie]),
  );
  const collectionPartIds = new Set(
    (collection.parts ?? []).map((part) => part.id),
  );

  const nextOverview = collection.overview ?? null;
  const nextPosterPath = collection.poster_path ?? null;
  const nextBackdropPath = collection.backdrop_path ?? null;
  const nextNumberOfParts = (collection.parts ?? []).length;

  if (
    franchise.name !== collection.name ||
    franchise.overview !== nextOverview ||
    franchise.posterPath !== nextPosterPath ||
    franchise.backdropPath !== nextBackdropPath ||
    franchise.numberOfParts !== nextNumberOfParts
  ) {
    mutations.metadataUpdates.push({
      id: franchise.id,
      values: {
        name: collection.name,
        overview: nextOverview,
        posterPath: nextPosterPath,
        backdropPath: nextBackdropPath,
        numberOfParts: nextNumberOfParts,
      },
    });
  }

  for (const part of collection.parts ?? []) {
    if (!linkedByTmdbId.has(part.id)) {
      mutations.movieLinks.push({
        franchiseDbId: franchise.id,
        part,
      });
    }
  }

  for (const linkedMovie of linkedMovies) {
    if (!collectionPartIds.has(linkedMovie.tmdbId)) {
      mutations.movieUnlinks.push({
        franchiseDbId: franchise.id,
        movieDbId: linkedMovie.id,
        movieTmdbId: linkedMovie.tmdbId,
      });
    }
  }
}

export async function applyFranchiseSyncMutations(
  mutations: FranchiseSyncMutations,
) {
  const db = getDb();
  const now = nowUnixSeconds();
  let written = 0;

  for (const update of mutations.metadataUpdates) {
    await db
      .update(franchises)
      .set({
        name: update.values.name,
        overview: update.values.overview,
        posterPath: update.values.posterPath,
        backdropPath: update.values.backdropPath,
        numberOfParts: update.values.numberOfParts,
        updatedAt: now,
      })
      .where(eq(franchises.id, update.id));
    written += 1;
  }

  for (const link of mutations.movieLinks) {
    const catalogMovie = await upsertCatalogMovieFromCollectionPart(
      link.part.id,
      link.part,
    );
    await linkMovieToFranchise(catalogMovie.id, link.franchiseDbId);
    written += 1;
  }

  const unlinksByFranchise = new Map<number, number[]>();
  for (const unlink of mutations.movieUnlinks) {
    const current = unlinksByFranchise.get(unlink.franchiseDbId) ?? [];
    current.push(unlink.movieDbId);
    unlinksByFranchise.set(unlink.franchiseDbId, current);
  }

  for (const [franchiseDbId, movieDbIds] of unlinksByFranchise) {
    await unlinkMoviesFromFranchise(franchiseDbId, movieDbIds);
    written += movieDbIds.length;
  }

  return { written };
}

export async function syncFranchiseCollectionFromTmdb(
  collection: TmdbCollection,
) {
  const franchise = await upsertFranchise({
    tmdbId: collection.id,
    name: collection.name,
    overview: collection.overview,
    posterPath: collection.poster_path,
    backdropPath: collection.backdrop_path,
    numberOfParts: (collection.parts ?? []).length,
  });

  const snapshot = await loadFranchiseSyncSnapshot();
  const mutations = emptyFranchiseSyncMutations();
  diffFranchiseCollection({
    franchise,
    collection,
    snapshot,
    mutations,
  });

  return applyFranchiseSyncMutations(mutations);
}

export async function listCatalogMoviesWithoutFranchise() {
  return getDb()
    .select({
      id: movies.id,
      tmdbId: movies.tmdbId,
    })
    .from(movies)
    .where(isNull(movies.franchiseId));
}

const BATCH_LINK_SIZE = 40;

export type BatchLinkCatalogMoviesResult = {
  linked: number;
  alreadyLinked: number;
  missingFromCatalog: number;
  conflictingFranchise: number;
};

export async function batchLinkCatalogMoviesByTmdbIds(
  franchiseDbId: number,
  partTmdbIds: number[],
  options?: { dryRun?: boolean },
): Promise<BatchLinkCatalogMoviesResult> {
  const uniquePartIds = [...new Set(partTmdbIds)];
  if (uniquePartIds.length === 0) {
    return {
      linked: 0,
      alreadyLinked: 0,
      missingFromCatalog: 0,
      conflictingFranchise: 0,
    };
  }

  const db = getDb();
  const now = nowUnixSeconds();
  let linked = 0;
  let alreadyLinked = 0;
  let conflictingFranchise = 0;
  const foundTmdbIds = new Set<number>();

  for (let index = 0; index < uniquePartIds.length; index += BATCH_LINK_SIZE) {
    const chunk = uniquePartIds.slice(index, index + BATCH_LINK_SIZE);
    const rows = await db
      .select({
        id: movies.id,
        tmdbId: movies.tmdbId,
        franchiseId: movies.franchiseId,
      })
      .from(movies)
      .where(inArray(movies.tmdbId, chunk));

    for (const row of rows) {
      foundTmdbIds.add(row.tmdbId);

      if (row.franchiseId === franchiseDbId) {
        alreadyLinked += 1;
        continue;
      }

      if (row.franchiseId !== null && row.franchiseId !== franchiseDbId) {
        conflictingFranchise += 1;
        continue;
      }

      linked += 1;
      if (!options?.dryRun) {
        await db
          .update(movies)
          .set({ franchiseId: franchiseDbId, updatedAt: now })
          .where(and(eq(movies.id, row.id), isNull(movies.franchiseId)));
      }
    }
  }

  const missingFromCatalog = uniquePartIds.filter(
    (tmdbId) => !foundTmdbIds.has(tmdbId),
  ).length;

  return {
    linked,
    alreadyLinked,
    missingFromCatalog,
    conflictingFranchise,
  };
}
