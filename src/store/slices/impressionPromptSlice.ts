import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { WATCH_STATUS } from "@/lib/constants";
import type { ContentMediaType } from "@/store/api/content-types";

export type ImpressionPromptReason =
  "movie-completed" | "series-completed" | "season-completed";

export type ImpressionPromptSource = "library" | "details";

export type ImpressionPromptTarget = {
  mediaType: ContentMediaType;
  tmdbId: number;
  title: string;
  source: ImpressionPromptSource;
  reason: ImpressionPromptReason;
  seasonNumber?: number;
};

export type ImpressionPromptStatus = "idle" | "submitting" | "failed";

export type ImpressionPromptState = {
  target: ImpressionPromptTarget | null;
  status: ImpressionPromptStatus;
  error: string | null;
  pendingValue: number | null;
};

type SeasonProgress = {
  season_number: number;
  episode_count?: number;
  episodes_watched: number;
};

type CompletionPromptInput = {
  mediaType: ContentMediaType;
  tmdbId: number;
  title: string;
  source: ImpressionPromptSource;
  impression: number | null | undefined;
  requestedWatchStatus?: number;
  requestedProgress?: { seasonNumber: number; episodeNumber: number };
  seasons?: SeasonProgress[];
  resultingWatchStatus?: number | null;
};

const initialState: ImpressionPromptState = {
  target: null,
  status: "idle",
  error: null,
  pendingValue: null,
};

function sameTitle(
  target: ImpressionPromptTarget | null,
  mediaType: ContentMediaType,
  tmdbId: number,
) {
  return target?.mediaType === mediaType && target.tmdbId === tmdbId;
}

export function completionImpressionPrompt(
  input: CompletionPromptInput,
): ImpressionPromptTarget | null {
  const completed = WATCH_STATUS[2].value;
  const base = {
    mediaType: input.mediaType,
    tmdbId: input.tmdbId,
    title: input.title,
    source: input.source,
  };

  if (input.mediaType === "movie") {
    const hasImpression =
      input.impression !== null && input.impression !== undefined;
    if (hasImpression || input.requestedWatchStatus !== completed) {
      return null;
    }

    return { ...base, reason: "movie-completed" };
  }

  const markedSeriesCompleted = input.requestedWatchStatus === completed;
  const season = input.requestedProgress
    ? input.seasons?.find(
        (item) => item.season_number === input.requestedProgress?.seasonNumber,
      )
    : undefined;
  const episodeCount = season?.episode_count ?? 0;
  const seasonCompleted =
    Boolean(input.requestedProgress) &&
    episodeCount > 0 &&
    (input.requestedProgress?.episodeNumber ?? 0) >= episodeCount &&
    (season?.episodes_watched ?? 0) >= episodeCount;
  const finishedSeries =
    markedSeriesCompleted || input.resultingWatchStatus === completed;

  if (markedSeriesCompleted || (seasonCompleted && finishedSeries)) {
    return { ...base, reason: "series-completed" };
  }

  if (seasonCompleted && input.requestedProgress) {
    return {
      ...base,
      reason: "season-completed",
      seasonNumber: input.requestedProgress.seasonNumber,
    };
  }

  return null;
}

const impressionPromptSlice = createSlice({
  name: "impressionPrompt",
  initialState,
  reducers: {
    impressionPromptRequested: (
      state,
      action: PayloadAction<ImpressionPromptTarget>,
    ) => {
      if (state.target) {
        return;
      }

      state.target = action.payload;
      state.status = "idle";
      state.error = null;
      state.pendingValue = null;
    },
    impressionPromptSubmitting: (state, action: PayloadAction<number>) => {
      if (!state.target) {
        return;
      }

      state.status = "submitting";
      state.error = null;
      state.pendingValue = action.payload;
    },
    impressionPromptResolved: (
      state,
      action: PayloadAction<{ mediaType: ContentMediaType; tmdbId: number }>,
    ) => {
      if (
        !sameTitle(
          state.target,
          action.payload.mediaType,
          action.payload.tmdbId,
        )
      ) {
        return;
      }

      state.target = null;
      state.status = "idle";
      state.error = null;
      state.pendingValue = null;
    },
    impressionPromptFailed: (
      state,
      action: PayloadAction<{
        mediaType: ContentMediaType;
        tmdbId: number;
        error: string;
      }>,
    ) => {
      if (
        !sameTitle(
          state.target,
          action.payload.mediaType,
          action.payload.tmdbId,
        )
      ) {
        return;
      }

      state.status = "failed";
      state.error = action.payload.error;
    },
  },
});

export const {
  impressionPromptFailed,
  impressionPromptRequested,
  impressionPromptResolved,
  impressionPromptSubmitting,
} = impressionPromptSlice.actions;
export default impressionPromptSlice.reducer;
