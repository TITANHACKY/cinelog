import { WATCH_STATUS } from "@/lib/constants";
import { AppError } from "@/lib/http/errors";
import { nowUnixSeconds } from "@/lib/media/display";
import {
  canUpdateMovieWatchActivity,
  toMovieStatusDisplay,
} from "@/lib/media/status";
import { getCachedTmdbMovie } from "@/lib/tmdb/cache";
import { pickMovieCertification } from "@/lib/tmdb/catalog-fields";
import {
  extractAllCast,
  extractDepartments,
} from "@/lib/tmdb/credits";
import { extractTrailer } from "@/lib/tmdb/videos";
import type { TmdbMovie } from "@/lib/types";
import type { MoviePatchInput } from "@/lib/validations/library";
import type { NewUserMovie } from "@/db/schema";
import {
  deleteUserMovie,
  findUserMovie,
  findUserMovieData,
  insertUserMovie,
  updateUserMovieByTmdbId,
} from "@/repositories/movies";
import { isUniqueConstraintError } from "@/lib/db/unique-constraint";

type UserMovieLibraryRow = {
  impression: number | null;
  watchStatus: number;
};

export type MovieLibraryFields = {
  is_present_in_watchlist: boolean;
  impression: number | null;
  watch_status: number | null;
};

function toMovieLibraryFields(
  userMovie?: UserMovieLibraryRow,
): MovieLibraryFields {
  return {
    is_present_in_watchlist: Boolean(userMovie),
    impression: userMovie?.impression ?? null,
    watch_status: userMovie?.watchStatus ?? null,
  };
}

import { isUserFollowingFranchise } from "@/repositories/franchises";

function extractDirectorAndCreators(movie: TmdbMovie) {
  let director: {
    id?: number;
    name?: string;
    profile_path?: string | null;
  } | null = null;
  const creators: Array<{ id?: number; name?: string; job?: string }> = [];

  if (movie.credits && !Array.isArray(movie.credits) && movie.credits.crew) {
    const dir = movie.credits.crew.find((c) => c.job === "Director");
    if (dir) {
      director = {
        id: dir.id,
        name: dir.name,
        profile_path: dir.profile_path,
      };
    }

    const seen = new Set<string>();
    for (const c of movie.credits.crew) {
      if (
        c.name &&
        c.job &&
        ["Screenplay", "Writer", "Story", "Characters"].includes(c.job) &&
        !seen.has(c.name)
      ) {
        seen.add(c.name);
        creators.push({ id: c.id, name: c.name, job: c.job });
      }
    }
  }

  return { director, creators };
}

function toMovieDetails(
  movie: TmdbMovie,
  userMovie?: UserMovieLibraryRow,
  isFollowingFranchise = false,
) {
  const { director, creators } = extractDirectorAndCreators(movie);
  const trailer = extractTrailer(movie.videos);
  const departments = extractDepartments(movie.credits);
  const watchProviders = movie["watch/providers"]?.results ?? {};
  const availableCountries = Object.keys(watchProviders);

  const allCast = extractAllCast(movie.credits);

  const franchise = movie.belongs_to_collection
    ? {
        id: movie.belongs_to_collection.id,
        name: movie.belongs_to_collection.name,
        poster_path: movie.belongs_to_collection.poster_path,
        backdrop_path: movie.belongs_to_collection.backdrop_path,
        overview: movie.belongs_to_collection.overview ?? null,
        is_following: isFollowingFranchise,
      }
    : null;

  const leadStudio = movie.production_companies?.[0]?.name ?? null;
  const network =
    movie.production_companies?.[1]?.name ??
    movie.production_companies?.[0]?.name ??
    null;

  return {
    backdrop_path: movie.backdrop_path,
    belongs_to_collection: movie.belongs_to_collection,
    genres: movie.genres ?? [],
    id: movie.id,
    imdb_id: movie.imdb_id,
    overview: movie.overview,
    poster_path: movie.poster_path,
    production_companies: movie.production_companies ?? [],
    release_date: movie.release_date ?? null,
    certification: pickMovieCertification(movie),
    runtime: movie.runtime,
    status: toMovieStatusDisplay(movie.status),
    title: movie.title,
    vote_average: movie.vote_average,
    original_language: movie.original_language,
    origin_country: movie.origin_country,
    director,
    creators,
    lead_studio: leadStudio,
    network,
    trailer,
    watch_providers: watchProviders,
    available_countries: availableCountries,
    spoken_languages: (movie.spoken_languages ?? []).map((l) => ({
      iso_639_1: l.iso_639_1 ?? "",
      english_name: l.english_name ?? "",
      name: l.name ?? "",
    })),
    departments,
    all_cast: allCast,
    franchise,
    ...toMovieLibraryFields(userMovie),
  };
}

export async function getMovieDetails(tmdbId: number, userId?: number) {
  const movie = await getCachedTmdbMovie(tmdbId);
  const userMovie = userId
    ? await findUserMovieData(tmdbId, userId)
    : undefined;

  const isFollowingFranchise =
    userId && movie.belongs_to_collection?.id
      ? await isUserFollowingFranchise(userId, movie.belongs_to_collection.id)
      : false;

  return toMovieDetails(movie, userMovie, isFollowingFranchise);
}

export async function addMovieToLibrary(tmdbId: number, userId: number) {
  const movie = await getCachedTmdbMovie(tmdbId);

  try {
    await insertUserMovie(tmdbId, userId, movie);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("Movie already exists in library", 409);
    }
    throw error;
  }

  return {
    ...toMovieDetails(movie),
    is_present_in_watchlist: true,
    impression: null,
    watch_status: 0,
  };
}

export async function removeMovieFromLibrary(tmdbId: number, userId: number) {
  const deleted = await deleteUserMovie(tmdbId, userId);

  if (deleted.length === 0) {
    throw new AppError("Movie not found in library", 404);
  }
}

export async function updateMovieInLibrary(
  tmdbId: number,
  userId: number,
  body: MoviePatchInput,
): Promise<MovieLibraryFields> {
  const existingMovie = await findUserMovie(tmdbId, userId);

  if (!existingMovie) {
    throw new AppError("Movie not found in library", 404);
  }

  if (
    (body.watch_status !== undefined || body.impression !== undefined) &&
    !canUpdateMovieWatchActivity(existingMovie.status)
  ) {
    throw new AppError(
      "Cannot update watch activity until the movie is released",
      400,
    );
  }

  const updateData: Partial<NewUserMovie> = {};
  const now = nowUnixSeconds();
  updateData.updatedAt = now;

  if (body.watch_status !== undefined) {
    updateData.watchStatus = body.watch_status;
    if (body.watch_status === WATCH_STATUS[2].value) {
      updateData.completedAt = now;
      updateData.lastWatchedAt = now;
    } else if (body.watch_status === WATCH_STATUS[1].value) {
      updateData.lastWatchedAt = now;
      updateData.completedAt = null;
    } else {
      updateData.completedAt = null;
      updateData.lastWatchedAt = null;
    }
  }

  if (body.impression !== undefined) {
    updateData.impression = body.impression;
  }

  const updatedMovie = await updateUserMovieByTmdbId(
    tmdbId,
    userId,
    updateData,
  );

  if (!updatedMovie) {
    throw new AppError("Movie not found in library", 404);
  }

  return toMovieLibraryFields({
    impression: updatedMovie.impression,
    watchStatus: updatedMovie.watchStatus,
  });
}
