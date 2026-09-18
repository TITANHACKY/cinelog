import { WATCH_STATUS } from "@/lib/constants";
import { AppError } from "@/lib/http/errors";
import { nowUnixSeconds } from "@/lib/media/display";
import {
  canUpdateMovieWatchActivity,
  toMovieStatusDisplay,
} from "@/lib/media/status";
import { pickMovieCertification } from "@/lib/tmdb/catalog-fields";
import { pickCastAndDirectors } from "@/lib/tmdb/credits";
import { tmdbFetch } from "@/lib/tmdb/client";
import type { MoviePayload, TmdbMovie } from "@/lib/types";
import type { MoviePatchInput } from "@/lib/validations/library";
import type { NewUserMovie } from "@/db/schema";
import {
  deleteUserMovie,
  findUserMovie,
  findUserMovieData,
  insertUserMovie,
  updateUserMovie,
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

async function fetchTmdbMovie(tmdbId: number) {
  const queryParams = new URLSearchParams({
    append_to_response: "release_dates,credits",
    language: "en-US",
  });

  return tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`, {
    searchParams: queryParams,
    failedMessage: "TMDB movie request failed",
  });
}

function toMovieLibraryFields(
  userMovie?: UserMovieLibraryRow,
): MovieLibraryFields {
  return {
    is_present_in_watchlist: Boolean(userMovie),
    impression: userMovie?.impression ?? null,
    watch_status: userMovie?.watchStatus ?? null,
  };
}

function toMovieDetails(movie: TmdbMovie, userMovie?: UserMovieLibraryRow) {
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
    tagline: movie.tagline,
    title: movie.title,
    vote_average: movie.vote_average,
    original_language: movie.original_language,
    origin_country: movie.origin_country,
    credits: pickCastAndDirectors(movie.credits),
    ...toMovieLibraryFields(userMovie),
  };
}

export async function getMovieDetails(tmdbId: number, userId?: number) {
  const movie = await fetchTmdbMovie(tmdbId);
  const userMovie = userId
    ? await findUserMovieData(tmdbId, userId).impression
    : undefined;

  return toMovieDetails(movie, userMovie);
}

export async function addMovieToLibrary(
  tmdbId: number,
  userId: number,
  body: MoviePayload,
) {
  try {
    await insertUserMovie(tmdbId, userId, body);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("Movie already exists in library", 409);
    }
    throw error;
  }

  return {
    ...body,
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
    const completedValue =
      Object.values(WATCH_STATUS).find((s) => s.display_value === "Completed")
        ?.value ?? 2;
    if (body.watch_status === completedValue) {
      updateData.completedAt = now;
    } else {
      updateData.completedAt = null;
    }
  }

  if (body.impression !== undefined) {
    updateData.impression = body.impression;
  }

  const updated = await updateUserMovie(tmdbId, userId, updateData);
  const updatedMovie = updated[0];

  if (!updatedMovie) {
    throw new AppError("Movie not found in library", 404);
  }

  return toMovieLibraryFields({
    impression: updatedMovie.impression,
    watchStatus: updatedMovie.watchStatus,
  });
}
