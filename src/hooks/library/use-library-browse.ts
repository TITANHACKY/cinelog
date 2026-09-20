"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LIBRARY_BROWSE_QUERY } from "@/lib/constants";
import { browseQueriesEqual } from "@/lib/media/library-browse";
import type { LibraryBrowseQuery, LibraryMediaType } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  libraryCollectionSelected,
  libraryQueryUpdated,
  libraryRequested,
} from "@/store/slices/librarySlice";

export function useLibraryBrowse(mediaType: LibraryMediaType) {
  const dispatch = useAppDispatch();
  const query = useAppSelector((state) => state.library.queries[mediaType]);
  const selectedCollectionId = useAppSelector(
    (state) => state.library.selectedCollectionIds[mediaType],
  );
  const [draftQ, setDraftQ] = useState(query.q);
  const [syncedQ, setSyncedQ] = useState(query.q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDraft, setDialogDraft] = useState(query);

  if (query.q !== syncedQ) {
    setSyncedQ(query.q);
    setDraftQ(query.q);
  }

  const applyQuery = useCallback(
    (next: LibraryBrowseQuery, options?: { skipFetch?: boolean }) => {
      const normalized: LibraryBrowseQuery = {
        ...next,
        q: next.q.trim(),
      };

      if (browseQueriesEqual(query, normalized)) {
        return;
      }

      dispatch(libraryQueryUpdated({ type: mediaType, query: normalized }));

      if (!options?.skipFetch && selectedCollectionId === null) {
        dispatch(libraryRequested({ type: mediaType }));
      }
    },
    [dispatch, mediaType, query, selectedCollectionId],
  );

  useEffect(() => {
    if (draftQ.trim() === query.q.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      applyQuery(
        { ...query, q: draftQ },
        { skipFetch: selectedCollectionId !== null },
      );
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [applyQuery, draftQ, query, selectedCollectionId]);

  const hasCustomFilters =
    selectedCollectionId === null &&
    (Boolean(query.filterField) ||
      query.groupBy !== undefined ||
      query.sortField !== DEFAULT_LIBRARY_BROWSE_QUERY.sortField ||
      query.sortDirection !== DEFAULT_LIBRARY_BROWSE_QUERY.sortDirection);

  const hasActiveBrowse =
    selectedCollectionId !== null ||
    Boolean(query.q.trim()) ||
    hasCustomFilters;

  function openDialog() {
    setDialogDraft(
      selectedCollectionId !== null ? DEFAULT_LIBRARY_BROWSE_QUERY : query,
    );
    setDialogOpen(true);
  }

  function applyDialog() {
    applyQuery({ ...dialogDraft, q: query.q });
    setDialogOpen(false);
  }

  function clearDialogFilters() {
    setDialogDraft(DEFAULT_LIBRARY_BROWSE_QUERY);
    applyQuery({ ...DEFAULT_LIBRARY_BROWSE_QUERY, q: query.q });
    setDialogOpen(false);
  }

  function selectCollection(collectionId: number | null) {
    dispatch(
      libraryCollectionSelected({
        type: mediaType,
        collectionId,
      }),
    );
    setDialogDraft(DEFAULT_LIBRARY_BROWSE_QUERY);
    applyQuery(
      { ...DEFAULT_LIBRARY_BROWSE_QUERY, q: query.q },
      { skipFetch: collectionId !== null },
    );
  }

  return {
    query,
    draftQ,
    setDraftQ,
    dialogOpen,
    setDialogOpen,
    dialogDraft,
    setDialogDraft,
    selectedCollectionId,
    hasActiveBrowse,
    hasCustomFilters,
    applyQuery,
    openDialog,
    applyDialog,
    clearDialogFilters,
    selectCollection,
  };
}
