type SeriesSeason = {
  air_date?: string | null;
  episode_count?: number;
  episodes_watched?: number;
  id?: number;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  season_number?: number;
  vote_average?: number;
};

type CreditMember = {
  id?: number;
  name?: string;
  profile_path?: string | null;
  character?: string;
  department?: string;
  job?: string;
  known_for_department?: string;
  order?: number;
};

type DepartmentCredits = {
  department: string;
  members: CreditMember[];
};

type WatchProviderItem = {
  logo_path?: string | null;
  provider_id?: number;
  provider_name?: string;
  display_priority?: number;
};

type WatchProviderCountry = {
  link?: string;
  flatrate?: WatchProviderItem[];
  rent?: WatchProviderItem[];
  buy?: WatchProviderItem[];
  ads?: WatchProviderItem[];
};

type MovieFranchiseInfo = {
  id: number;
  name: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  is_following?: boolean;
};

type SeriesDetails = {
  backdrop_path?: string | null;
  content_ratings?: {
    iso_3166_1?: string;
    rating?: string;
  };
  created_by?: Array<{
    id?: number;
    name?: string;
    profile_path?: string | null;
  }>;
  first_air_date?: string;
  genres?: Array<{ id?: number; name?: string }>;
  id?: number;
  imdb_id?: string | null;
  last_air_date?: string;
  name?: string | null;
  number_of_episodes?: number;
  number_of_seasons?: number;
  overview?: string | null;
  poster_path?: string | null;
  seasons?: SeriesSeason[];
  original_language?: string | null;
  status?: string | null;
  tagline?: string | null;
  type?: string;
  vote_average?: number;
  is_present_in_watchlist?: boolean;
  impression?: number | null;
  watch_status?: number | null;
  total_number_of_episodes_watched?: number;
  total_number_of_seasons_watched?: number;
  production_companies?: Array<{
    id?: number;
    name?: string;
    origin_country?: string;
  }>;
  credits?: CreditMember[];
};

type MovieDetails = {
  backdrop_path?: string | null;
  genres?: Array<{ id?: number; name?: string }>;
  id?: number;
  imdb_id?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  production_companies?: Array<{
    id?: number;
    name?: string;
    origin_country?: string;
  }>;
  release_date?: string | null;
  certification?: {
    certification?: string | null;
    descriptors?: string[];
    iso_639_1?: string | null;
    note?: string | null;
    release_date?: string;
    type?: number;
  } | null;
  runtime?: number | null;
  original_language?: string | null;
  origin_country?: string[] | null;
  status?: string | null;
  tagline?: string | null;
  title?: string | null;
  vote_average?: number;
  is_present_in_watchlist?: boolean;
  impression?: number | null;
  watch_status?: number | null;
  credits?: CreditMember[];
  director?: {
    id?: number;
    name?: string;
    profile_path?: string | null;
  } | null;
  creators?: Array<{ id?: number; name?: string; job?: string }>;
  lead_studio?: string | null;
  network?: string | null;
  trailer?: { key: string; name: string; site: string } | null;
  watch_providers?: Record<string, WatchProviderCountry>;
  available_countries?: string[];
  spoken_languages?: Array<{
    iso_639_1: string;
    english_name: string;
    name: string;
  }>;
  departments?: DepartmentCredits[];
  all_cast?: CreditMember[];
  franchise?: MovieFranchiseInfo | null;
};

type LibraryMovie = {
  tmdb_id: number;
  watch_status: number;
  impression: number | null;
  created_at: string | null;
  updated_at: string | null;
  last_watched_at?: string | null;
  completed_at: string | null;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  status: string | null;
  original_language: string | null;
  origin_country: string | null;
  certificate?: string | null;
  genres?: string[];
  is_present_in_watchlist?: boolean;
};

type LibraryCount = {
  movies: number;
  series: number;
};

type LibraryGroup = {
  key: string;
  label: string;
  count: number;
  hasMore?: boolean;
};

type LibraryMetadata = {
  count: LibraryCount;
  offset: number;
  limit: number;
  hasMore: boolean;
  groups?: LibraryGroup[];
};

type LibrarySeriesSeason = {
  season_number: number;
  episode_count: number;
  episodes_watched: number;
  air_date: string | null;
};

type LibrarySeries = {
  tmdb_id: number;
  watch_status: number;
  impression: number | null;
  created_at: string | null;
  updated_at: string | null;
  last_watched_at: string | null;
  completed_at: string | null;
  name: string;
  vote_average: number | null;
  first_air_date: string | null;
  last_air_date: string | null;
  total_number_of_episodes: number | null;
  total_number_of_seasons: number | null;
  total_number_of_seasons_watched: number | null;
  total_number_of_episodes_watched: number | null;
  poster_path: string | null;
  status: string | null;
  original_language: string | null;
  origin_country?: string | null;
  certificate?: string | null;
  genres?: string[];
  seasons_info: LibrarySeriesSeason[];
};

type CollectionFilterItem = {
  id?: number;
  smartCollectionId?: number;
  field: string;
  operator: number;
  value: string;
};

type CollectionSortItem = {
  id?: number;
  smartCollectionId?: number;
  field: string;
  direction: number;
  priority: number;
};

type LanguageOption = {
  iso_639_1: string;
  english_name: string;
};

type CountryOption = {
  iso_3166_1: string;
  english_name: string;
};

type SmartCollectionWithFilters = {
  id: number;
  userId: number;
  name: string;
  mediaType: number;
  showInDashboard: boolean;
  showInLibrary: boolean;
  groupBy: number | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string | null;
  filters: CollectionFilterItem[];
  sorts?: CollectionSortItem[];
};

export type {
  CollectionFilterItem,
  CollectionSortItem,
  CountryOption,
  CreditMember,
  DepartmentCredits,
  LanguageOption,
  LibraryCount,
  LibraryGroup,
  LibraryMetadata,
  LibraryMovie,
  LibrarySeries,
  LibrarySeriesSeason,
  MovieDetails,
  MovieFranchiseInfo,
  SeriesDetails,
  SeriesSeason,
  SmartCollectionWithFilters,
  WatchProviderCountry,
  WatchProviderItem,
};
