import { getCachedTmdbCollection, getCachedTmdbMovie } from "@/lib/tmdb/cache";
import { findUserMovieData, insertUserMovie } from "@/repositories/movies";
import {
  deleteUserFranchise,
  getUserFollowedFranchises as getRepoFollowedFranchises,
  insertUserFranchise,
  isUserFollowingFranchise,
  upsertFranchise,
  type GetUserFollowedFranchisesOptions,
} from "@/repositories/franchises";
import type { TmdbCollection } from "@/lib/types";

export async function getFranchiseDetails(
  collectionId: number,
  userId?: number,
) {
  const collection: TmdbCollection =
    await getCachedTmdbCollection(collectionId);

  const isFollowing = userId
    ? await isUserFollowingFranchise(userId, collectionId)
    : false;

  const sortedParts = [...(collection.parts ?? [])].sort((a, b) => {
    if (!a.release_date) return 1;
    if (!b.release_date) return -1;
    return a.release_date.localeCompare(b.release_date);
  });

  const partsWithLibraryStatus = await Promise.all(
    sortedParts.map(async (part) => {
      const userMovie = userId
        ? await findUserMovieData(part.id, userId)
        : undefined;

      return {
        ...part,
        is_present_in_watchlist: Boolean(userMovie),
        watch_status: userMovie?.watchStatus ?? null,
      };
    }),
  );

  return {
    id: collection.id,
    name: collection.name,
    overview: collection.overview || null,
    poster_path: collection.poster_path || null,
    backdrop_path: collection.backdrop_path || null,
    is_following: isFollowing,
    parts: partsWithLibraryStatus,
  };
}

async function afterBlockAddFranchiseMovies(
  collection: TmdbCollection,
  userId: number,
) {
  await Promise.allSettled(
    (collection.parts ?? []).map(async (part) => {
      try {
        const existing = await findUserMovieData(part.id, userId);
        if (!existing) {
          const fullMovie = await getCachedTmdbMovie(part.id);
          await insertUserMovie(part.id, userId, fullMovie);
        }
      } catch {
        // Continue inserting remaining movies if one fails
      }
    }),
  );
}

export async function followFranchise(collectionId: number, userId: number) {
  const collection = await getCachedTmdbCollection(collectionId);

  const franchise = await upsertFranchise({
    tmdbId: collection.id,
    name: collection.name,
    overview: collection.overview,
    posterPath: collection.poster_path,
    backdropPath: collection.backdrop_path,
  });

  await insertUserFranchise(userId, franchise.id);

  // after_block(): Add all movies under this franchise to the user's library
  void afterBlockAddFranchiseMovies(collection, userId);

  return {
    success: true,
    is_following: true,
  };
}

export async function unfollowFranchise(collectionId: number, userId: number) {
  await deleteUserFranchise(userId, collectionId);
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
  return followed;
}
