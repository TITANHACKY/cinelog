type RouteContext = {
  params: Promise<{ id: string }>;
};

type TmdbCastMember = {
  id?: number;
  name?: string;
  order?: number;
  character?: string;
  profile_path?: string | null;
  known_for_department?: string;
  department?: string;
  [key: string]: unknown;
};

type TmdbCrewMember = {
  id?: number;
  name?: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
  known_for_department?: string;
  [key: string]: unknown;
};

type TmdbGenreList = {
  genres?: Array<{ id?: number; name?: string }> | null;
};

type TmdbConfigurationLanguage = {
  iso_639_1?: string;
  english_name?: string;
  name?: string;
};

type TmdbConfigurationCountry = {
  iso_3166_1?: string;
  english_name?: string;
  native_name?: string;
};

type TmdbReleaseDate = {
  certification?: string | null;
  descriptors?: string[];
  iso_639_1?: string | null;
  note?: string | null;
  release_date?: string;
  type?: number;
};

type TmdbCollectionPart = {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  genre_ids?: number[];
  popularity?: number;
};

type TmdbCollection = {
  id: number;
  name: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  parts: TmdbCollectionPart[];
};

type TmdbMovie = {
  backdrop_path?: string | null;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    overview?: string | null;
  } | null;
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
  videos?: {
    results?: Array<{
      id?: string;
      iso_639_1?: string;
      iso_3166_1?: string;
      key?: string;
      name?: string;
      site?: string;
      size?: number;
      type?: string;
      official?: boolean;
      published_at?: string;
    }>;
  };
  "watch/providers"?: {
    results?: Record<
      string,
      {
        link?: string;
        flatrate?: Array<{
          logo_path?: string | null;
          provider_id?: number;
          provider_name?: string;
          display_priority?: number;
        }>;
        rent?: Array<{
          logo_path?: string | null;
          provider_id?: number;
          provider_name?: string;
          display_priority?: number;
        }>;
        buy?: Array<{
          logo_path?: string | null;
          provider_id?: number;
          provider_name?: string;
          display_priority?: number;
        }>;
      }
    >;
  };
  spoken_languages?: Array<{
    iso_639_1?: string;
    english_name?: string;
    name?: string;
  }>;
};

type MoviePayload = Omit<TmdbMovie, "release_dates"> & {
  certification?: TmdbReleaseDate | null;
};

type TmdbContentRating = {
  iso_3166_1?: string;
  rating?: string;
  [key: string]: unknown;
};

type TmdbEpisodeToAir = {
  air_date?: string;
  episode_number?: number;
  id?: number;
  name?: string;
  overview?: string;
  season_number?: number;
};

type TmdbNetwork = {
  id?: number;
  name?: string;
  logo_path?: string | null;
  origin_country?: string;
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
  networks?: TmdbNetwork[] | null;
  next_episode_to_air?: TmdbEpisodeToAir | null;
  last_episode_to_air?: TmdbEpisodeToAir | null;
  spoken_languages?: Array<{
    iso_639_1?: string;
    english_name?: string;
    name?: string;
  }>;
  videos?: TmdbMovie["videos"];
  "watch/providers"?: TmdbMovie["watch/providers"];
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
  TmdbCollection,
  TmdbCollectionPart,
  TmdbConfigurationCountry,
  TmdbConfigurationLanguage,
  TmdbContentRating,
  TmdbCrewMember,
  TmdbGenreList,
  TmdbMovie,
  TmdbReleaseDate,
  TmdbResult,
  TmdbSearchResponse,
  TmdbSeries,
};
