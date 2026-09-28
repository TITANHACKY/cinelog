"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  canUpdateMovieWatchActivity,
  canUpdateSeriesWatchActivity,
} from "@/lib/media/status";
import type { MovieDetails, SeriesDetails } from "@/lib/types";
import type {
  ContentMediaType,
  ContentMutation,
  ContentMutationStatus,
  ContentProgressMutation,
} from "@/store/api/content-types";
import { submitContentMutation } from "@/store/api/content-details-api";
import { useAppDispatch } from "@/store";

type UseContentMutationOptions = {
  id?: number;
  mediaType?: ContentMediaType;
  mutationStatus?: ContentMutationStatus;
  isPresentInWatchlist?: boolean;
  content?: MovieDetails | SeriesDetails;
};

export function useContentMutation({
  id,
  mediaType,
  mutationStatus = "idle",
  isPresentInWatchlist = false,
  content,
}: UseContentMutationOptions) {
  const dispatch = useAppDispatch();
  const isPendingRef = useRef(false);
  const isMutating = mutationStatus === "loading";

  useEffect(() => {
    if (mutationStatus !== "loading") {
      isPendingRef.current = false;
    }
  }, [mutationStatus]);

  const canUpdateWatchActivity =
    mediaType === "movie"
      ? canUpdateMovieWatchActivity(content?.status)
      : mediaType === "series"
        ? canUpdateSeriesWatchActivity(content?.status)
        : false;

  const requestMutation = useCallback(
    (
      mutation: ContentMutation,
      options?: {
        value?: number | null;
        progress?: ContentProgressMutation;
        requireWatchlist?: boolean;
        requireWatchActivity?: boolean;
      },
    ) => {
      const requireWatchlist =
        options?.requireWatchlist ?? mutation !== "add-watchlist";
      const requireWatchActivity =
        options?.requireWatchActivity ?? mutation !== "add-watchlist";

      if (
        id === undefined ||
        !mediaType ||
        isMutating ||
        isPendingRef.current
      ) {
        return;
      }
      if (requireWatchlist && !isPresentInWatchlist) return;
      if (requireWatchActivity && !canUpdateWatchActivity) return;

      isPendingRef.current = true;
      void submitContentMutation(dispatch, {
        id: String(id),
        mediaType,
        mutation,
        value: options?.value,
        progress: options?.progress,
      });
    },
    [
      canUpdateWatchActivity,
      dispatch,
      id,
      isMutating,
      isPresentInWatchlist,
      mediaType,
    ],
  );

  return {
    requestMutation,
    isMutating,
    canUpdateWatchActivity,
  };
}
