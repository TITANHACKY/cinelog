"use client";

import { useState } from "react";
import type { DiscoverRow, DiscoverTitle } from "@/lib/types";
import { useGetDiscoverRowPagesInfiniteQuery } from "@/store/api/discover-api";

function titleKey(title: DiscoverTitle) {
  return `${title.mediaType}-${title.tmdbId}`;
}

export function useDiscoverRow(row: DiscoverRow) {
  const [paging, setPaging] = useState(false);
  const query = useGetDiscoverRowPagesInfiniteQuery(row.key, {
    skip: !paging,
  });

  const seen = new Set<string>();
  const items: DiscoverTitle[] = [];
  const fetched = (query.data?.pages ?? []).flatMap((page) => page.items);
  for (const item of [...row.items, ...fetched]) {
    const key = titleKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }

  const hasMore = query.data ? Boolean(query.hasNextPage) : row.hasMore;

  function onNearEnd() {
    if (!hasMore || query.isFetching) return;
    if (!paging) {
      // Un-skipping fetches the first extra page (page 2).
      setPaging(true);
      return;
    }
    void query.fetchNextPage();
  }

  return { items, isFetchingMore: query.isFetching, onNearEnd };
}
