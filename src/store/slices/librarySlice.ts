import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DEFAULT_LIBRARY_BROWSE_QUERY } from "@/lib/constants";
import type { LibraryBrowseQuery, LibraryMediaType } from "@/lib/types";

export type { LibraryMediaType };

export type LibraryState = {
  queries: Record<LibraryMediaType, LibraryBrowseQuery>;
  selectedCollectionIds: Record<LibraryMediaType, number | null>;
};

const initialState: LibraryState = {
  queries: {
    movie: DEFAULT_LIBRARY_BROWSE_QUERY,
    series: DEFAULT_LIBRARY_BROWSE_QUERY,
  },
  selectedCollectionIds: {
    movie: null,
    series: null,
  },
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    libraryCollectionSelected: (
      state,
      action: PayloadAction<{
        type: LibraryMediaType;
        collectionId: number | null;
      }>,
    ) => {
      state.selectedCollectionIds[action.payload.type] =
        action.payload.collectionId;
    },
    libraryQueryUpdated: (
      state,
      action: PayloadAction<{
        type: LibraryMediaType;
        query: LibraryBrowseQuery;
      }>,
    ) => {
      state.queries[action.payload.type] = action.payload.query;
    },
    librarySearchQueryUpdated: (
      state,
      action: PayloadAction<{
        type: LibraryMediaType;
        q: string;
      }>,
    ) => {
      state.queries[action.payload.type].q = action.payload.q;
    },
    libraryBrowseReset: (state) => {
      state.queries = {
        movie: DEFAULT_LIBRARY_BROWSE_QUERY,
        series: DEFAULT_LIBRARY_BROWSE_QUERY,
      };
      state.selectedCollectionIds = {
        movie: null,
        series: null,
      };
    },
  },
});

export const {
  libraryBrowseReset,
  libraryCollectionSelected,
  libraryQueryUpdated,
  librarySearchQueryUpdated,
} = librarySlice.actions;
export default librarySlice.reducer;
