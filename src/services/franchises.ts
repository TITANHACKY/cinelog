import { getCachedTmdbCollection } from "@/lib/tmdb/cache";
import {
  mapFollowedFranchiseToApi,
  mapFranchiseDetailsToApi,
  mapTmdbCollectionPartToSource,
} from "@/lib/media/franchise-mapper";
import { toFranchiseProgressApiFromCounts } from "@/lib/media/franchise-progress";
import {
  countUserCompletedFranchiseParts,
  findUserFranchiseProgress,
} from "@/repositories/franchise-progress";
import {
  deleteUserFranchise,
  findFranchiseByTmdbId,
  findFranchiseMovies,
  getUserFollowedFranchises as getRepoFollowedFranchises,
  insertUserFranchise,
  isUserFollowingFranchise,
  type GetUserFollowedFranchisesOptions,
} from "@/repositories/franchises";
import {
  ensureUserMovie,
  getUserMovieStatusesForTmdbIds,
} from "@/repositories/movies";
import { syncFranchiseCollectionFromTmdb } from "@/repositories/franchise-sync";
import type { TmdbCollection } from "@/lib/types";

function sortPartsByReleaseDate<T extends { release_date?: string | null }>(
  parts: T[],
) {
  return [...parts].sort((a, b) => {
    if (!a.release_date) return 1;
    if (!b.release_date) return -1;
    return a.release_date.localeCompare(b.release_date);
  });
}

async function buildPartsFromDb(franchiseDbId: number, userId?: number) {
  const catalogMovies = await findFranchiseMovies(franchiseDbId);
  const tmdbIds = catalogMovies.map((movie) => movie.tmdbId);
  const userStatuses = userId
    ? await getUserMovieStatusesForTmdbIds(userId, tmdbIds)
    : new Map();

  return sortPartsByReleaseDate(
    catalogMovies.map((movie) => {
      const userStatus = userStatuses.get(movie.tmdbId);
      return {
        id: movie.tmdbId,
        title: movie.title,
        overview: null,
        poster_path: movie.posterPath,
        backdrop_path: null,
        release_date: movie.releaseDate,
        vote_average: movie.voteAverage,
        vote_count: null,
        original_language: movie.originalLanguage,
        is_present_in_watchlist: Boolean(userStatus),
        watch_status: userStatus?.watchStatus ?? null,
      };
    }),
  );
}

async function buildPartsFromTmdb(collection: TmdbCollection, userId?: number) {
  const sortedParts = sortPartsByReleaseDate(collection.parts ?? []);
  const tmdbIds = sortedParts.map((part) => part.id);
  const userStatuses = userId
    ? await getUserMovieStatusesForTmdbIds(userId, tmdbIds)
    : new Map();

  return sortedParts.map((part) =>
    mapTmdbCollectionPartToSource(part, userStatuses.get(part.id)),
  );
}

export async function getFranchiseDetails(
  collectionTmdbId: number,
  userId?: number,
) {
  const franchise = await findFranchiseByTmdbId(collectionTmdbId);
  const isFollowing = userId
    ? await isUserFollowingFranchise(userId, collectionTmdbId)
    : false;

  if (franchise) {
    const parts = await buildPartsFromDb(franchise.id, userId);
    const storedProgress =
      userId && isFollowing
        ? await findUserFranchiseProgress(userId, franchise.id)
        : null;

    return mapFranchiseDetailsToApi({
      id: franchise.tmdbId,
      name: franchise.name,
      overview: franchise.overview,
      poster_path: franchise.posterPath,
      backdrop_path: franchise.backdropPath,
      is_following: isFollowing,
      parts,
      progress: storedProgress
        ? toFranchiseProgressApiFromCounts(
            storedProgress.numberOfPartsCompleted,
            storedProgress.numberOfParts,
          )
        : undefined,
    });
  }

  const collection = await getCachedTmdbCollection(collectionTmdbId);
  const parts = await buildPartsFromTmdb(collection, userId);

  return mapFranchiseDetailsToApi({
    id: collection.id,
    name: collection.name,
    overview: collection.overview ?? null,
    poster_path: collection.poster_path ?? null,
    backdrop_path: collection.backdrop_path ?? null,
    is_following: isFollowing,
    parts,
  });
}

export async function followFranchise(
  collectionTmdbId: number,
  userId: number,
) {
  const collection = await getCachedTmdbCollection(collectionTmdbId);

  await syncFranchiseCollectionFromTmdb(collection);

  const franchise = await findFranchiseByTmdbId(collection.id);
  if (!franchise) {
    throw new Error(`Failed to upsert franchise for tmdb_id ${collection.id}`);
  }

  for (const part of collection.parts ?? []) {
    await ensureUserMovie(part.id, userId);
  }

  const completedCount = await countUserCompletedFranchiseParts(
    userId,
    franchise.id,
  );

  await insertUserFranchise(userId, franchise.id, completedCount);

  return {
    success: true,
    is_following: true,
  };
}

export async function unfollowFranchise(
  collectionTmdbId: number,
  userId: number,
) {
  await deleteUserFranchise(userId, collectionTmdbId);
  return {
    success: true,
    is_following: false,
  };
}

export async function getUserFollowedFranchises(
  userId: number,
  options?: GetUserFollowedFranchisesOptions,
) {
  const followed = await getRepoFollowedFranchises(userId, options);

  const franchisesWithProgress = followed.franchises.map((row) =>
    mapFollowedFranchiseToApi({
      tmdbId: row.tmdbId,
      name: row.name,
      overview: row.overview,
      posterPath: row.posterPath,
      backdropPath: row.backdropPath,
      followedAt: row.followedAt,
      progress: toFranchiseProgressApiFromCounts(
        row.numberOfPartsCompleted,
        row.numberOfParts,
      ),
    }),
  );

  return {
    franchises: franchisesWithProgress,
    total_count: followed.totalCount,
    has_more: followed.hasMore,
  };
}
