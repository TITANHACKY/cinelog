"use client";

import { useCallback, useState } from "react";
import { apiErrorMessage } from "@/store/api/base-api";
import {
  loadMoreCollection,
  loadMoreCollectionGroup,
  useGetCollectionViewQuery,
} from "@/store/api/library-api";
import { useAppDispatch } from "@/store";

export function useLibraryCollection(
  collectionId: number | null,
  search: string,
) {
  const dispatch = useAppDispatch();
  const [loadingMore, setLoadingMore] = useState(false);
  const result = useGetCollectionViewQuery(
    { collectionId: collectionId ?? 0, search },
    { skip: collectionId === null, refetchOnMountOrArgChange: 30 },
  );
  const data = collectionId ? result.currentData : undefined;

  const loadMore = useCallback(async () => {
    if (
      !collectionId ||
      loadingMore ||
      !data ||
      data.groupBy !== null ||
      !data.hasMore
    ) {
      return;
    }
    setLoadingMore(true);
    try {
      await loadMoreCollection(
        dispatch,
        collectionId,
        search,
        data.items.length,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [collectionId, data, dispatch, loadingMore, search]);

  const loadMoreGroup = useCallback(
    async (groupKey: string) => {
      if (!collectionId || !data) return;
      const page = data.groupPages[groupKey];
      if (!page?.hasMore || page.loadingMore) return;
      try {
        await loadMoreCollectionGroup(
          dispatch,
          collectionId,
          search,
          groupKey,
          page.items.length,
        );
      } catch {
        // The page loader is cleared inside loadMoreCollectionGroup.
      }
    },
    [collectionId, data, dispatch, search],
  );

  return {
    data,
    isLoading: collectionId !== null && result.isLoading,
    error: result.isError
      ? apiErrorMessage(result.error, "Failed to load collection")
      : null,
    loadingMore,
    loadMore,
    loadMoreGroup,
  };
}
