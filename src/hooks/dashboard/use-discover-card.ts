"use client";

import { useLibraryItemMutation } from "@/hooks/library/use-library-item-mutation";
import type { DiscoverTitle, LibraryMediaType } from "@/lib/types";
import { apiErrorMessage } from "@/store/api/base-api";
import { useAddTitleMutation } from "@/store/api/user-api";
import { useAppDispatch } from "@/store";
import { showToast } from "@/store/slices/toastSlice";

export function useDiscoverCard(item: DiscoverTitle) {
  const dispatch = useAppDispatch();
  const mediaType: LibraryMediaType = item.mediaType === 0 ? "movie" : "series";
  // Shared key: the same title in two rows shares one pending state.
  const [addTitle, addState] = useAddTitleMutation({
    fixedCacheKey: `discover-add-${mediaType}-${item.tmdbId}`,
  });
  const {
    isPending,
    isStatusPending,
    isRemovePending,
    requestMutation,
    requestRemove,
  } = useLibraryItemMutation(mediaType, item.tmdbId);

  async function add() {
    try {
      await addTitle({ mediaType, tmdbId: item.tmdbId }).unwrap();
      dispatch(
        showToast({ message: "Added to your watchlist", variant: "success" }),
      );
    } catch (error) {
      dispatch(
        showToast({
          message: apiErrorMessage(error, "Couldn't add this title."),
          variant: "error",
        }),
      );
    }
  }

  return {
    href: `/${mediaType}/${item.tmdbId}`,
    isAdding: addState.isLoading,
    isStatusPending,
    isRemovePending,
    isPending: isPending || addState.isLoading,
    add: () => {
      void add();
    },
    setStatus: (watchStatus: number) =>
      requestMutation({ watch_status: watchStatus, title: item.title }),
    remove: () => requestRemove({ title: item.title }),
  };
}
