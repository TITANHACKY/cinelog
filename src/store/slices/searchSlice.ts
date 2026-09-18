import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SearchMediaType = "movie" | "series";
export type SearchStatus = "idle" | "loading" | "success" | "failed";

export type SearchResult = {
  genres: string[];
  id?: number;
  is_present_in_watchlist?: boolean;
  watch_status?: number | null;
  original_language?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  title?: string;
  vote_average?: number;
};

export type SearchRequestPayload = {
  mediaType: SearchMediaType;
  query: string;
  year?: number;
  language?: string;
  page: number;
};

type SearchMediaState = {
  error?: string;
  query: string;
  year?: number;
  language?: string;
  page: number;
  total_pages: number;
  total_results: number;
  results: SearchResult[];
  status: SearchStatus;
};

export type SearchState = Record<SearchMediaType, SearchMediaState>;

const initialMediaState: SearchMediaState = {
  query: "",
  page: 1,
  total_pages: 0,
  total_results: 0,
  results: [],
  status: "idle",
};

const initialState: SearchState = {
  movie: initialMediaState,
  series: initialMediaState,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    searchRequested: (state, action: PayloadAction<SearchRequestPayload>) => {
      const mediaState = state[action.payload.mediaType];
      mediaState.error = undefined;
      mediaState.query = action.payload.query;
      mediaState.year = action.payload.year;
      mediaState.language = action.payload.language;
      mediaState.page = action.payload.page;
      mediaState.results = [];
      mediaState.status = "loading";
    },
    searchSucceeded: (
      state,
      action: PayloadAction<{
        mediaType: SearchMediaType;
        query: string;
        results: SearchResult[];
        page: number;
        total_pages: number;
        total_results: number;
      }>,
    ) => {
      const mediaState = state[action.payload.mediaType];
      mediaState.error = undefined;
      mediaState.query = action.payload.query;
      mediaState.results = action.payload.results;
      mediaState.page = action.payload.page;
      mediaState.total_pages = action.payload.total_pages;
      mediaState.total_results = action.payload.total_results;
      mediaState.status = "success";
    },
    searchFailed: (
      state,
      action: PayloadAction<{
        error: string;
        mediaType: SearchMediaType;
        query: string;
      }>,
    ) => {
      const mediaState = state[action.payload.mediaType];
      mediaState.error = action.payload.error;
      mediaState.query = action.payload.query;
      mediaState.results = [];
      mediaState.total_pages = 0;
      mediaState.total_results = 0;
      mediaState.status = "failed";
    },
    searchCleared: (state, action: PayloadAction<SearchMediaType>) => {
      state[action.payload] = { ...initialMediaState };
    },
  },
});

export const { searchCleared, searchFailed, searchRequested, searchSucceeded } =
  searchSlice.actions;
export default searchSlice.reducer;
