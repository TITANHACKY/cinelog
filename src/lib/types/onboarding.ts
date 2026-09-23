export type MediaLean = 0 | 1 | 2; // 0 movies, 1 series, 2 both
export type MediaType = 0 | 1; // 0 movie, 1 series

export type TitleCandidate = {
  // normalized card shape (suggestions + search)
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null; // raw TMDB path (media-card builds the URL)
  year: string | null;
  rating: number | null;
  inWatchlist?: boolean; // already on the user's watchlist
};

export type UserPreferencesInput = {
  // client -> PUT /api/user/preferences
  mediaLean: MediaLean;
  minRating: number | null; // 6 | 7 | 8 | null
  eras: string[]; // subset of ERA_BUCKETS values
  genreIds: number[]; // TMDB genre ids, 1..10
  languages: string[]; // ISO-639-1 codes, 1..6
};

export type UserPreferences = UserPreferencesInput; // GET returns same shape
