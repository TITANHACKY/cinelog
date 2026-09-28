"use client";

import type { LibraryMediaType } from "@/lib/types";
import {
  submitLibraryMutation,
  useMutateLibraryItemMutation,
  type LibraryMutationInput,
} from "@/store/api/library-api";
import { useAppDispatch } from "@/store";

export function useLibraryItemMutation(
  mediaType: LibraryMediaType,
  tmdbId: number,
) {
  const dispatch = useAppDispatch();
  const fixedCacheKey = `library-item-${mediaType}-${tmdbId}`;
  const [, mutation] = useMutateLibraryItemMutation({ fixedCacheKey });
  const variables = mutation.originalArgs;
  const isPending = mutation.isLoading;

  function requestMutation(
    payload: Omit<LibraryMutationInput, "mediaType" | "tmdbId" | "remove">,
  ) {
    void submitLibraryMutation(dispatch, { mediaType, tmdbId, ...payload });
  }

  function requestRemove(payload?: { title?: string }) {
    void submitLibraryMutation(dispatch, {
      mediaType,
      tmdbId,
      remove: true,
      ...payload,
    });
  }

  return {
    isPending,
    isStatusPending: isPending && variables?.watch_status !== undefined,
    isProgressPending: isPending && variables?.progress !== undefined,
    isRemovePending: isPending && variables?.remove === true,
    requestMutation,
    requestRemove,
  };
}
