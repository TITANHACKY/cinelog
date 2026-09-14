"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LIBRARY_BROWSE_QUERY } from "@/lib/constants";
import { browseQueriesEqual } from "@/lib/media/library-browse";
import type { LibraryBrowseQuery, LibraryMediaType } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { libraryQueryUpdated, libraryRequested } from "@/store/slices/librarySlice";

export function useLibraryBrowse(mediaType: LibraryMediaType) {
  const dispatch = useAppDispatch();
  const query = useAppSelector((state) => state.library.query);
  const [draftQ, setDraftQ] = useState(query.q);
  const [syncedQ, setSyncedQ] = useState(query.q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDraft, setDialogDraft] = useState(query);

  if (query.q !== syncedQ) {
    setSyncedQ(query.q);
    setDraftQ(query.q);
  }

  const applyQuery = useCallback(
    (next: LibraryBrowseQuery) => {
      const normalized: LibraryBrowseQuery = {
        ...next,
        q: next.q.trim(),
      };

      if (browseQueriesEqual(query, normalized)) {
        return;
      }

      dispatch(libraryQueryUpdated(normalized));
      dispatch(libraryRequested({ type: mediaType }));
    },
    [dispatch, mediaType, query],
  );

  useEffect(() => {
    if (draftQ.trim() === query.q.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      applyQuery({ ...query, q: draftQ });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [applyQuery, draftQ, query]);

  const hasActiveBrowse =
    Boolean(query.q.trim()) ||
    Boolean(query.filterField) ||
    query.groupBy !== undefined ||
    query.sortField !== DEFAULT_LIBRARY_BROWSE_QUERY.sortField ||
    query.sortDirection !== DEFAULT_LIBRARY_BROWSE_QUERY.sortDirection;

  function openDialog() {
    setDialogDraft(query);
    setDialogOpen(true);
  }

  function applyDialog() {
    applyQuery({ ...dialogDraft, q: query.q });
    setDialogOpen(false);
  }

  function clearBrowse() {
    setDraftQ("");
    setDialogDraft(DEFAULT_LIBRARY_BROWSE_QUERY);
    applyQuery(DEFAULT_LIBRARY_BROWSE_QUERY);
    setDialogOpen(false);
  }

  return {
    query,
    draftQ,
    setDraftQ,
    dialogOpen,
    setDialogOpen,
    dialogDraft,
    setDialogDraft,
    hasActiveBrowse,
    applyQuery,
    openDialog,
    applyDialog,
    clearBrowse,
  };
}
