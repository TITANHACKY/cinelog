import { Clapperboard, TvMinimal, type LucideIcon } from "lucide-react";

import { SMART_COLLECTIONS } from "@/lib/constants/api";
import type {
  LibraryBrowseQuery,
  LibraryFilterField,
  LibraryMediaType,
  LibraryOperator,
  LibrarySortField,
} from "@/lib/types/library";

export const MEDIA_TYPES: {
  icon: LucideIcon;
  label: string;
  value: LibraryMediaType;
  href: string;
}[] = [
  {
    icon: Clapperboard,
    label: "Movies",
    value: "movie",
    href: "/library/movies",
  },
  {
    icon: TvMinimal,
    label: "Series",
    value: "series",
    href: "/library/series",
  },
];

export const COLLECTION_MEDIA_TYPE: Record<LibraryMediaType, number> = {
  movie: 0,
  series: 1,
};

export const LIBRARY_FILTER_FIELDS = Object.values(
  SMART_COLLECTIONS.filter_field,
).map((field) => ({
  value: field.value,
  label: field.display_value,
}));

export const LIBRARY_OPERATORS = Object.entries(SMART_COLLECTIONS.operator).map(
  ([key, operator]) => ({
    value: Number(key) as LibraryOperator,
    label: operator.display_value,
  }),
);

export const LIBRARY_OPERATORS_BY_FIELD: Record<
  LibraryFilterField,
  LibraryOperator[]
> = {
  watch_status: [0, 1, 4],
  impression: [0, 1, 4],
  vote_average: [0, 1, 2, 3],
  release_year: [0, 1, 2, 3],
  status: [0, 1, 4],
  genre: [0, 1, 4],
  original_language: [0, 1, 4],
  origin_country: [0, 1, 4],
};

export const LIBRARY_GROUP_OPTIONS = [
  { value: "", label: "None" },
  ...Object.entries(SMART_COLLECTIONS.group_by).map(([key, group]) => ({
    value: key,
    label: group.display_value,
  })),
];

export const LIBRARY_SORT_OPTIONS: {
  field: LibrarySortField;
  direction: 0 | 1;
  label: string;
  seriesOnly?: boolean;
}[] = [
  { field: "created_at", direction: 1, label: "Date Added (Newest)" },
  { field: "created_at", direction: 0, label: "Date Added (Oldest)" },
  { field: "release_date", direction: 1, label: "Release Date (Newest)" },
  { field: "release_date", direction: 0, label: "Release Date (Oldest)" },
  { field: "title", direction: 0, label: "Title (A-Z)" },
  { field: "title", direction: 1, label: "Title (Z-A)" },
  { field: "vote_average", direction: 1, label: "Rating (Highest)" },
  { field: "vote_average", direction: 0, label: "Rating (Lowest)" },
  { field: "completed_at", direction: 1, label: "Completed (Newest)" },
  { field: "completed_at", direction: 0, label: "Completed (Oldest)" },
  {
    field: "last_watched_at",
    direction: 1,
    label: "Last Watched (Newest)",
    seriesOnly: true,
  },
  {
    field: "last_watched_at",
    direction: 0,
    label: "Last Watched (Oldest)",
    seriesOnly: true,
  },
];

export const LIBRARY_BROWSE_SESSION_KEY = "cinelog-library-browse";

export const LIBRARY_COLLECTION_ACTIVE_HINT =
  "Manual filters are disabled while a smart collection is selected. Choose Browse manually to edit filters.";

export const LIBRARY_CUSTOM_FILTERS_ACTIVE_HINT =
  "Smart collections are disabled while manual filters are applied. Clear filters to choose a collection.";

export const DEFAULT_LIBRARY_BROWSE_QUERY: LibraryBrowseQuery = {
  q: "",
  sortField: "created_at",
  sortDirection: 1,
};

export const LIBRARY_DESCRIPTION =
  "Browse and manage your saved movies and series.";

export const LIBRARY_EMPTY_TITLE = "No titles are found";
export const LIBRARY_EMPTY_DESCRIPTION =
  "To add more titles click on the search button and search for desired titles";
export const LIBRARY_ERROR_TITLE = "Something went wrong";
export const LIBRARY_ERROR_DESCRIPTION =
  "We could not load your library. Please try again in a moment.";
