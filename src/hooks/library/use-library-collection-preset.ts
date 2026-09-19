"use client";

import { useCallback, useEffect, useState } from "react";
import { LIBRARY_PAGE_SIZE } from "@/lib/constants";
import { apiFetch } from "@/lib/http/client";
import {
  libraryGroupKey,
  libraryGroupLabel,
  withGroupHasMore,
} from "@/lib/media/library-browse";
import type {
  CustomCollectionWithFilters,
  LibraryGroup,
  LibraryGroupBy,
  LibraryMetadata,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";

type CollectionItemsResponse = {
  collection: CustomCollectionWithFilters;
  movies: LibraryMovie[];
  series: LibrarySeries[];
  metadata: LibraryMetadata;
};

type GroupPage = {
  items: Array<LibraryMovie | LibrarySeries>;
  hasMore: boolean;
  loadingMore: boolean;
};

function buildGroupPages(
  items: Array<LibraryMovie | LibrarySeries>,
  groups: LibraryGroup[],
  groupBy: LibraryGroupBy,
): Record<string, GroupPage> {
  const pages: Record<string, GroupPage> = {};
  for (const group of groups) {
    const groupItems = items.filter(
      (item) => libraryGroupKey(item, groupBy) === group.key,
    );
    pages[group.key] = {
      items: groupItems,
      hasMore: group.hasMore ?? groupItems.length < group.count,
      loadingMore: false,
    };
  }
  return pages;
}

export function useLibraryCollectionPreset(
  collectionId: number | null,
  searchQ: string,
) {
  const [collection, setCollection] =
    useState<CustomCollectionWithFilters | null>(null);
  const [items, setItems] = useState<Array<LibraryMovie | LibrarySeries>>([]);
  const [groups, setGroups] = useState<LibraryGroup[] | undefined>();
  const [metadata, setMetadata] = useState<LibraryMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [groupPages, setGroupPages] = useState<Record<string, GroupPage>>({});
  const [error, setError] = useState<string | null>(null);

  const isGrouped =
    collection?.groupBy !== null && collection?.groupBy !== undefined;

  const fetchItems = useCallback(
    async (options?: { offset?: number; groupKey?: string }) => {
      if (!collectionId) return null;

      const params = new URLSearchParams({
        offset: String(options?.offset ?? 0),
        limit: String(LIBRARY_PAGE_SIZE),
      });
      const q = searchQ.trim();
      if (q) params.set("q", q);
      if (options?.groupKey) params.set("group_key", options.groupKey);

      const res = await apiFetch(
        `/api/collections/${collectionId}/items?${params.toString()}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load collection items");
      }

      return (data.data ?? data) as CollectionItemsResponse;
    },
    [collectionId, searchQ],
  );

  useEffect(() => {
    if (!collectionId) return;

    let ignore = false;

    void (async () => {
      setError(null);
      setIsLoading(true);

      try {
        const result = await fetchItems({ offset: 0 });
        if (ignore || !result) return;

        setCollection(result.collection);
        setMetadata(result.metadata);
        const pageItems =
          result.collection.mediaType === 0 ? result.movies : result.series;

        if (result.collection.groupBy !== null && result.metadata.groups) {
          const groupBy = result.collection.groupBy as LibraryGroupBy;
          const mediaType =
            result.collection.mediaType === 0 ? "movie" : "series";
          const normalizedGroups =
            withGroupHasMore(
              result.metadata.groups.map((group) => ({
                ...group,
                label: libraryGroupLabel(groupBy, group.key, mediaType),
              })),
              pageItems,
              groupBy,
              mediaType,
            ) ?? [];
          setGroups(normalizedGroups);
          setGroupPages(buildGroupPages(pageItems, normalizedGroups, groupBy));
          setItems([]);
        } else {
          setGroups(undefined);
          setGroupPages({});
          setItems(pageItems);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load collection",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [collectionId, searchQ, fetchItems]);

  const loadMoreGallery = useCallback(async () => {
    if (!collectionId || isGrouped || loadingMore || !metadata?.hasMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchItems({ offset: items.length });
      if (!result) return;
      const pageItems =
        result.collection.mediaType === 0 ? result.movies : result.series;
      setItems((prev) => [...prev, ...pageItems]);
      setMetadata(result.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [
    collectionId,
    fetchItems,
    isGrouped,
    items.length,
    loadingMore,
    metadata?.hasMore,
  ]);

  const loadMoreGroup = useCallback(
    async (groupKey: string) => {
      const page = groupPages[groupKey];
      if (!collectionId || !page?.hasMore || page.loadingMore) return;

      setGroupPages((prev) => ({
        ...prev,
        [groupKey]: { ...prev[groupKey]!, loadingMore: true },
      }));

      try {
        const result = await fetchItems({
          offset: page.items.length,
          groupKey,
        });
        if (!result) return;
        const pageItems =
          result.collection.mediaType === 0 ? result.movies : result.series;
        setGroupPages((prev) => ({
          ...prev,
          [groupKey]: {
            items: [...prev[groupKey]!.items, ...pageItems],
            hasMore: result.metadata.hasMore,
            loadingMore: false,
          },
        }));
      } catch {
        setGroupPages((prev) => ({
          ...prev,
          [groupKey]: { ...prev[groupKey]!, loadingMore: false },
        }));
      }
    },
    [collectionId, fetchItems, groupPages],
  );

  const count =
    collection && metadata
      ? collection.mediaType === 0
        ? metadata.count.movies
        : metadata.count.series
      : 0;

  if (!collectionId) {
    return {
      collection: null,
      items: [],
      groups: undefined,
      groupPages: {},
      metadata: null,
      count: 0,
      isLoading: false,
      loadingMore: false,
      isGrouped: false,
      error: null,
      loadMoreGallery: async () => {},
      loadMoreGroup: async () => {},
    };
  }

  return {
    collection,
    items,
    groups,
    groupPages,
    metadata,
    count,
    isLoading,
    loadingMore,
    isGrouped,
    error,
    loadMoreGallery,
    loadMoreGroup,
  };
}
