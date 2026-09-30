"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadMoreFollowedFranchises,
  useGetFollowedFranchisesQuery,
  type FollowedFranchisesQueryArgs,
} from "@/store/api/franchises-api";
import { useAppDispatch } from "@/store";

export type FranchiseSortOption =
  "name-asc" | "name-desc" | "date-desc" | "date-asc";

export function useLibraryFranchises() {
  const dispatch = useAppDispatch();
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortOption, setSortOption] = useState<FranchiseSortOption>("name-asc");

  // Debounce search query input (300ms)
  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      window.clearTimeout(handler);
    };
  }, [searchQuery]);

  const { sortBy, sortOrder } = useMemo<{
    sortBy: "name" | "followedAt";
    sortOrder: "asc" | "desc";
  }>(() => {
    switch (sortOption) {
      case "name-desc":
        return { sortBy: "name", sortOrder: "desc" };
      case "date-desc":
        return { sortBy: "followedAt", sortOrder: "desc" };
      case "date-asc":
        return { sortBy: "followedAt", sortOrder: "asc" };
      case "name-asc":
      default:
        return { sortBy: "name", sortOrder: "asc" };
    }
  }, [sortOption]);

  const queryArgs = useMemo<FollowedFranchisesQueryArgs>(
    () => ({
      q: debouncedQuery.trim() || undefined,
      sortBy,
      sortOrder,
    }),
    [debouncedQuery, sortBy, sortOrder],
  );

  const result = useGetFollowedFranchisesQuery(queryArgs);
  const data = result.currentData ?? result.data;

  const loadMore = useCallback(async () => {
    if (!data || !data.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMoreFollowedFranchises(
        dispatch,
        data.franchises.length,
        queryArgs,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [data, dispatch, loadingMore, queryArgs]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
  }, []);

  return {
    franchises: data?.franchises ?? [],
    totalCount: data?.totalCount ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading: !data && (result.isLoading || result.isFetching),
    isFetching: result.isFetching,
    isError: result.isError,
    loadingMore,
    loadMore,
    searchQuery,
    setSearchQuery,
    clearSearch,
    sortOption,
    setSortOption,
    sortBy,
    sortOrder,
    isSearchActive: Boolean(searchQuery.trim()),
  };
}
