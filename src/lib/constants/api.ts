export const AUTH_TOKEN_TTL_SECONDS = 24 * 60 * 60;
export const AUTH_COOKIE = "auth_token";

export const TMDB_API_BASE = "https://api.themoviedb.org/3";

export const LIBRARY_PAGE_SIZE_MAX = 50;
export const SEARCH_PAGE_MAX = 500;
export const MAX_COLLECTION_FILTERS = 3;

export const DIRECT_VALIDATION_MESSAGES = new Set([
  "Invalid watch_status",
  "Invalid impression",
  "Invalid language",
  "Invalid origin country",
  "No valid fields to update",
  "Current password is required to set a new password",
]);

export const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export const SMART_COLLECTIONS = {
  media_type: {
    0: { value: "movie", display_value: "Movie" },
    1: { value: "series", display_value: "Series" },
  },
  group_by: {
    0: { value: "watch_status", display_value: "Watch Status" },
    1: { value: "impression", display_value: "Impression" },
    2: { value: "status", display_value: "Status" },
  },
  operator: {
    0: { value: "eq", display_value: "Equals" },
    1: { value: "neq", display_value: "Not Equals" },
    2: { value: "gt", display_value: "Greater Than" },
    3: { value: "lt", display_value: "Less Than" },
    4: { value: "in", display_value: "In" }
  },
  direction: {
    0: { value: "asc", display_value: "Ascending" },
    1: { value: "desc", display_value: "Descending" },
  },
  filter_field: {
    watch_status: { value: "watch_status", display_value: "Watch Status" },
    impression: { value: "impression", display_value: "User Impression" },
    vote_average: { value: "vote_average", display_value: "Rating" },
    release_year: { value: "release_year", display_value: "Release Year" },
    status: { value: "status", display_value: "Status" },
    genre: { value: "genre", display_value: "Genre" },
    original_language: {
      value: "original_language",
      display_value: "Original Language",
    },
    origin_country: {
      value: "origin_country",
      display_value: "Origin Country",
    },
  },
  sort_field: {
    created_at: { value: "created_at", display_value: "Date Added" },
    release_date: { value: "release_date", display_value: "Release Date" },
    title: { value: "title", display_value: "Title (A-Z)" },
    vote_average: { value: "vote_average", display_value: "Rating" },
    last_watched_at: {
      value: "last_watched_at",
      display_value: "Last Watched",
    },
    completed_at: { value: "completed_at", display_value: "Completed Date" },
  },
} as const;
