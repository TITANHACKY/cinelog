export const FIELD_OPTIONS = [
  { value: "release_year", label: "Release Year" },
  { value: "certification", label: "Certification" },
  { value: "genre", label: "Genre" },
  { value: "original_language", label: "Language" },
  { value: "origin_country", label: "Origin Country" },
];

export const OPERATOR_OPTIONS = [
  { value: 0, label: "=" },
  { value: 1, label: "!=" },
  { value: 2, label: ">" },
  { value: 3, label: "<" },
  { value: 4, label: "in" },
];

export const SORT_OPTIONS = [
  { field: "release_date", direction: 1, label: "Release Date (Newest)" },
  { field: "release_date", direction: 0, label: "Release Date (Oldest)" },
  { field: "vote_average", direction: 1, label: "Rating (Highest)" },
  { field: "title", direction: 0, label: "Title (A-Z)" },
  { field: "created_at", direction: 1, label: "Recently Added" },
];

export const COMMON_CERTS = [
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
  "U",
  "U/A",
  "A",
  "TV-Y7",
  "TV-PG",
  "TV-14",
  "TV-MA",
];
