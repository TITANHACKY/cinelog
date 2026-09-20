export type MediaLean = 0 | 1 | 2; // 0 movies, 1 series, 2 both
export type MediaType = 0 | 1; // 0 movie, 1 series

export type SeedTitle = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null; // full URL or null
};

export type TitleCandidate = {
  // normalized card shape (suggestions + search)
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  year: string | null;
};

export type UserPreferencesInput = {
  // client -> PUT /api/user/preferences
  mediaLean: MediaLean;
  minRating: number | null; // 6 | 7 | 8 | null
  eras: string[]; // subset of ERA_BUCKETS values
  genreIds: number[]; // TMDB genre ids, 1..10
  languages: string[]; // ISO-639-1 codes, 0..6
  seedTitles: SeedTitle[]; // 0..12
};

export type UserPreferences = UserPreferencesInput; // GET returns same shape
