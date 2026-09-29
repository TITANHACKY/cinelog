"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import type { DiscoverTitle } from "@/lib/types";
import { apiErrorMessage } from "@/store/api/base-api";
import { useGetDiscoverRowPagesInfiniteQuery } from "@/store/api/discover-api";

function titleKey(title: DiscoverTitle) {
  return `${title.mediaType}-${title.tmdbId}`;
}

export function useDiscoverRowItems(key: string | null) {
  const query = useGetDiscoverRowPagesInfiniteQuery(key ?? skipToken, {
    refetchOnMountOrArgChange: 300,
  });
  // currentData, not data: after a dropdown switch the old key's titles must
  // not show while the new key loads.
  const pages = query.currentData?.pages ?? [];
  const seen = new Set<string>();
  const items: DiscoverTitle[] = [];
  for (const item of pages.flatMap((page) => page.items)) {
    if (seen.has(titleKey(item))) continue;
    seen.add(titleKey(item));
    items.push(item);
  }

  return {
    items,
    isLoading: key !== null && !query.currentData && !query.error,
    isFetchingMore: query.isFetchingNextPage,
    errorMessage: query.error
      ? apiErrorMessage(query.error, "Couldn't load this row.")
      : null,
    isRetrying: Boolean(query.error) && query.isFetching,
    retry: () => {
      void query.refetch();
    },
    onNearEnd: () => {
      if (!query.hasNextPage || query.isFetching) return;
      void query.fetchNextPage();
    },
  };
}
