"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  readLibraryBrowseSession,
  writeLibraryBrowseSession,
} from "@/lib/media/library-browse-session";
import { browseQueriesEqual } from "@/lib/media/library-browse";
import type { LibraryMediaType } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  libraryCollectionSelected,
  libraryQueryUpdated,
} from "@/store/slices/librarySlice";

const MEDIA_TYPES: LibraryMediaType[] = ["movie", "series"];

export function useLibraryBrowseSession() {
  const dispatch = useAppDispatch();
  const queries = useAppSelector((state) => state.library.queries);
  const selectedCollectionIds = useAppSelector(
    (state) => state.library.selectedCollectionIds,
  );
  const hydrated = useRef(false);
  const persistReady = useRef(false);

  useLayoutEffect(() => {
    if (hydrated.current) {
      return;
    }

    hydrated.current = true;
    const stored = readLibraryBrowseSession();

    if (stored) {
      for (const mediaType of MEDIA_TYPES) {
        const storedMedia = stored[mediaType];

        if (!browseQueriesEqual(queries[mediaType], storedMedia.query)) {
          dispatch(
            libraryQueryUpdated({
              type: mediaType,
              query: storedMedia.query,
            }),
          );
        }

        if (
          selectedCollectionIds[mediaType] !==
          storedMedia.selectedCollectionId
        ) {
          dispatch(
            libraryCollectionSelected({
              type: mediaType,
              collectionId: storedMedia.selectedCollectionId,
            }),
          );
        }
      }
    }

    persistReady.current = true;
    // Hydrate once on mount before the library fetch effect runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (!persistReady.current) {
      return;
    }

    writeLibraryBrowseSession({
      movie: {
        query: queries.movie,
        selectedCollectionId: selectedCollectionIds.movie,
      },
      series: {
        query: queries.series,
        selectedCollectionId: selectedCollectionIds.series,
      },
    });
  }, [queries, selectedCollectionIds]);
}
