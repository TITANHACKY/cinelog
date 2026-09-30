import {
  calculateFranchiseProgress,
  toFranchiseProgressApi,
} from "@/lib/media/franchise-progress";
import type { TmdbCollectionPart } from "@/lib/types";

export type FranchisePartSource = {
  id: number;
  title?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  original_language?: string | null;
  is_present_in_watchlist?: boolean;
  watch_status?: number | null;
};

export type FranchiseDetailsSource = {
  id: number;
  name: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  is_following: boolean;
  parts: FranchisePartSource[];
  progress?: ReturnType<typeof toFranchiseProgressApi>;
};

export function mapFranchisePartToApi(part: FranchisePartSource) {
  return {
    id: part.id,
    title: part.title ?? "Untitled",
    overview: part.overview ?? null,
    poster_path: part.poster_path ?? null,
    backdrop_path: part.backdrop_path ?? null,
    release_date: part.release_date ?? null,
    vote_average: part.vote_average ?? null,
    vote_count: part.vote_count ?? null,
    original_language: part.original_language ?? null,
    is_present_in_watchlist: part.is_present_in_watchlist ?? false,
    watch_status: part.watch_status ?? null,
  };
}

export function mapFranchiseDetailsToApi(source: FranchiseDetailsSource) {
  const parts = source.parts.map(mapFranchisePartToApi);
  const progress =
    source.progress ??
    toFranchiseProgressApi(calculateFranchiseProgress(parts));

  return {
    id: source.id,
    name: source.name,
    overview: source.overview ?? null,
    poster_path: source.poster_path ?? null,
    backdrop_path: source.backdrop_path ?? null,
    is_following: source.is_following,
    progress,
    parts,
  };
}

export function mapTmdbCollectionPartToSource(
  part: TmdbCollectionPart,
  userStatus?: { watchStatus: number; impression: number | null } | null,
): FranchisePartSource {
  return {
    id: part.id,
    title: part.title,
    overview: part.overview,
    poster_path: part.poster_path,
    backdrop_path: part.backdrop_path,
    release_date: part.release_date,
    vote_average: part.vote_average,
    vote_count: part.vote_count,
    original_language: part.original_language,
    is_present_in_watchlist: Boolean(userStatus),
    watch_status: userStatus?.watchStatus ?? null,
  };
}

export function mapFollowedFranchiseToApi(input: {
  tmdbId: number;
  name: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  followedAt: string | null;
  progress: ReturnType<typeof toFranchiseProgressApi>;
}) {
  return {
    id: input.tmdbId,
    name: input.name,
    overview: input.overview,
    poster_path: input.posterPath,
    backdrop_path: input.backdropPath,
    followed_at: input.followedAt,
    progress: input.progress,
  };
}
