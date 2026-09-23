"use client";

import { useEffect, useRef } from "react";
import type {
  LibraryMediaType,
  LibraryMovie,
  LibrarySeries,
  LibrarySeriesSeason,
} from "@/lib/types";
import { useAppSelector } from "@/store";
import type { SeriesProgressFields } from "@/store/slices/librarySlice";

type GroupPage = {
  items: Array<LibraryMovie | LibrarySeries>;
  hasMore: boolean;
  loadingMore: boolean;
};

type MutationPatch = {
  watch_status?: number;
  impression?: number | null;
  seriesUpdate?: SeriesProgressFields;
};

type UsePatchCollectionItemsOnMutationSuccessOptions = {
  mediaType: LibraryMediaType | undefined;
  setItems: React.Dispatch<
    React.SetStateAction<Array<LibraryMovie | LibrarySeries>>
  >;
  setGroupPages?: React.Dispatch<
    React.SetStateAction<Record<string, GroupPage>>
  >;
};

function applySeriesProgressPatch(
  item: LibrarySeries,
  update: SeriesProgressFields,
) {
  if (update.watch_status !== null) {
    item.watch_status = update.watch_status;
  }
  item.impression = update.impression;
  item.total_number_of_episodes_watched =
    update.total_number_of_episodes_watched;
  item.total_number_of_seasons_watched = update.total_number_of_seasons_watched;

  const airDateBySeason = new Map(
    item.seasons_info.map((season) => [season.season_number, season.air_date]),
  );

  item.seasons_info = update.seasons.map(
    (season): LibrarySeriesSeason => ({
      season_number: season.season_number,
      episode_count: season.episode_count,
      episodes_watched: season.episodes_watched,
      air_date: airDateBySeason.get(season.season_number) ?? null,
    }),
  );
}

function patchItemInPlace(
  item: LibraryMovie | LibrarySeries,
  mutation: MutationPatch,
): LibraryMovie | LibrarySeries {
  if (mutation.seriesUpdate && "seasons_info" in item) {
    const next = { ...item } as LibrarySeries;
    applySeriesProgressPatch(next, mutation.seriesUpdate);
    return next;
  }

  const next = { ...item };
  if (mutation.watch_status !== undefined) {
    next.watch_status = mutation.watch_status;
  }
  if (mutation.impression !== undefined) {
    next.impression = mutation.impression;
  }
  return next;
}

function patchItemsList(
  items: Array<LibraryMovie | LibrarySeries>,
  tmdbId: number,
  mutation: MutationPatch,
) {
  const index = items.findIndex((item) => item.tmdb_id === tmdbId);
  if (index === -1) {
    return items;
  }

  const next = [...items];
  next[index] = patchItemInPlace(items[index], mutation);
  return next;
}

export function usePatchCollectionItemsOnMutationSuccess({
  mediaType,
  setItems,
  setGroupPages,
}: UsePatchCollectionItemsOnMutationSuccessOptions) {
  const lastSuccessfulMutation = useAppSelector(
    (state) => state.library.lastSuccessfulMutation,
  );
  const processedNonceRef = useRef(0);

  useEffect(() => {
    if (!lastSuccessfulMutation || !mediaType) {
      return;
    }

    if (lastSuccessfulMutation.nonce === processedNonceRef.current) {
      return;
    }

    if (lastSuccessfulMutation.mediaType !== mediaType) {
      return;
    }

    processedNonceRef.current = lastSuccessfulMutation.nonce;

    const { tmdbId, watch_status, impression, seriesUpdate } =
      lastSuccessfulMutation;
    const mutation: MutationPatch = { watch_status, impression, seriesUpdate };

    setItems((prev) => {
      if (!prev.some((item) => item.tmdb_id === tmdbId)) {
        return prev;
      }
      return patchItemsList(prev, tmdbId, mutation);
    });

    if (setGroupPages) {
      setGroupPages((prev) => {
        let changed = false;
        const next: Record<string, GroupPage> = { ...prev };

        for (const groupKey of Object.keys(next)) {
          const page = next[groupKey];
          const index = page.items.findIndex((item) => item.tmdb_id === tmdbId);
          if (index === -1) {
            continue;
          }

          changed = true;
          const patchedItems = [...page.items];
          patchedItems[index] = patchItemInPlace(page.items[index], mutation);
          next[groupKey] = { ...page, items: patchedItems };
        }

        return changed ? next : prev;
      });
    }
  }, [lastSuccessfulMutation, mediaType, setGroupPages, setItems]);
}
