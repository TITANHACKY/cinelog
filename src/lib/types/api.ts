type RouteContext = {
  params: Promise<{ id: string }>;
};

type TmdbCastMember = {
  id?: number;
  name?: string;
  order?: number;
  known_for_department?: string;
  [key: string]: unknown;
};

type TmdbCrewMember = {
  id?: number;
  name?: string;
  known_for_department?: string;
  [key: string]: unknown;
};

type TmdbGenreList = {
  genres?: Array<{ id?: number; name?: string }> | null;
};

type TmdbReleaseDate = {
  certification?: string | null;
  descriptors?: string[];
  iso_639_1?: string | null;
  note?: string | null;
  release_date?: string;
  type?: number;
};

type TmdbMovie = {
  backdrop_path?: string | null;
  belongs_to_collection?: unknown;
  genres?: Array<{ id?: number; name?: string }> | null;
  id?: number;
  imdb_id?: string | null;
  overview?: string;
  poster_path?: string | null;
  production_companies?: Array<{
    id?: number;
    name?: string;
    origin_country?: string;
  }> | null;
  release_date?: string;
  runtime?: number | null;
  status?: string;
  tagline?: string | null;
  title?: string;
  vote_average?: number;
  original_language?: string | null;
  origin_country?: string[] | null;
  release_dates?: {
    results?: Array<{
      iso_3166_1?: string;
      release_dates?: TmdbReleaseDate[];
      [key: string]: unknown;
    }>;
  };
  credits?:
    | {
        cast?: TmdbCastMember[];
        crew?: TmdbCrewMember[];
      }
    | Array<{ id?: number; name?: string; known_for_department?: string }>;
};

type MoviePayload = Omit<TmdbMovie, "release_dates"> & {
  certification?: TmdbReleaseDate | null;
};

type TmdbContentRating = {
  iso_3166_1?: string;
  rating?: string;
  [key: string]: unknown;
};

type TmdbSeries = {
  backdrop_path?: string | null;
  created_by?: Array<{
    id?: number;
    name?: string;
    profile_path?: string | null;
  }> | null;
  first_air_date?: string;
  genres?: Array<{ id?: number; name?: string }> | null;
  id?: number;
  last_air_date?: string;
  name?: string;
  networks?: unknown[] | null;
  number_of_episodes?: number;
  number_of_seasons?: number;
  overview?: string;
  poster_path?: string | null;
  production_companies?: Array<{
    id?: number;
    name?: string;
    origin_country?: string;
  }> | null;
  seasons?: Array<{
    id?: number;
    name?: string;
    season_number?: number;
    episode_count?: number;
    air_date?: string;
  }> | null;
  status?: string;
  tagline?: string | null;
  type?: string;
  vote_average?: number;
  original_language?: string | null;
  origin_country?: string[] | null;
  content_ratings?: {
    results?: TmdbContentRating[];
  };
  imdb_id?: string | null;
  external_ids?: {
    imdb_id?: string | null;
  };
  credits?:
    | {
        cast?: TmdbCastMember[];
        crew?: TmdbCrewMember[];
      }
    | Array<{ id?: number; name?: string; known_for_department?: string }>;
};

type SearchType = "movie" | "tv";

type TmdbResult = {
  genre_ids?: number[];
  id?: number;
  original_language?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  title?: string;
  name?: string;
  vote_average?: number;
};

type TmdbSearchResponse = {
  page?: number;
  results?: TmdbResult[];
  total_pages?: number;
  total_results?: number;
};

export type {
  MoviePayload,
  RouteContext,
  SearchType,
  TmdbCastMember,
  TmdbContentRating,
  TmdbCrewMember,
  TmdbGenreList,
  TmdbMovie,
  TmdbReleaseDate,
  TmdbResult,
  TmdbSearchResponse,
  TmdbSeries,
};
