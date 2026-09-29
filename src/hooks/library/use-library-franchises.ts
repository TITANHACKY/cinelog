"use client";

import { useCallback, useState } from "react";
import {
  loadMoreFollowedFranchises,
  useGetFollowedFranchisesQuery,
} from "@/store/api/franchises-api";
import { useAppDispatch } from "@/store";

export function useLibraryFranchises() {
  const dispatch = useAppDispatch();
  const [loadingMore, setLoadingMore] = useState(false);
  const result = useGetFollowedFranchisesQuery();
  const data = result.currentData ?? result.data;

  const loadMore = useCallback(async () => {
    if (!data || !data.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMoreFollowedFranchises(dispatch, data.franchises.length);
    } finally {
      setLoadingMore(false);
    }
  }, [data, dispatch, loadingMore]);

  return {
    franchises: data?.franchises ?? [],
    totalCount: data?.totalCount ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading: !data && (result.isLoading || result.isFetching),
    isError: result.isError,
    loadingMore,
    loadMore,
  };
}
