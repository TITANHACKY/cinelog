"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import { GENRE_MAX, LANGUAGE_MAX, MIN_WATCHLIST_TITLES } from "@/lib/constants";
import type { MediaLean, UserPreferencesInput } from "@/lib/types";

const STEP_COUNT = 5; // media-lean, genres, languages, era-rating, titles

// Per-viewer convenience: keep an in-progress draft alive across reloads/closes.
const DRAFT_STORAGE_KEY = "cinelog:onboarding-draft";

type PersistedState = {
  draft: UserPreferencesInput;
  mediaLeanChosen: boolean;
  stepIndex: number;
};

const emptyDraft: UserPreferencesInput = {
  mediaLean: 2,
  minRating: null,
  eras: [],
  genreIds: [],
  languages: [],
};

function toggle<T>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((item) => item !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export function useOnboardingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [mediaLeanChosen, setMediaLeanChosen] = useState(false);
  const [draft, setDraft] = useState<UserPreferencesInput>(emptyDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  // Titles the user has added to their watchlist this session (keyed
  // `${mediaType}-${tmdbId}`). Lives here, not in StepTitles, so the count
  // survives navigating between steps and can gate "Finish".
  const [addedTitleKeys, setAddedTitleKeys] = useState<Set<string>>(new Set());

  const markTitleAdded = useCallback((key: string) => {
    setAddedTitleKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  // Restore an in-progress draft saved on a previous visit (same browser).
  // We deliberately initialize to `emptyDraft` and hydrate from storage in a
  // mount effect (not a lazy initializer) so the server and first client render
  // match — avoiding an SSR hydration mismatch. The one-time setState here is
  // intentional, hence the scoped rule disable.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PersistedState>;
        if (saved && typeof saved === "object" && saved.draft) {
          setDraft({ ...emptyDraft, ...saved.draft });
          if (typeof saved.mediaLeanChosen === "boolean") {
            setMediaLeanChosen(saved.mediaLeanChosen);
          }
          if (
            typeof saved.stepIndex === "number" &&
            saved.stepIndex >= 0 &&
            saved.stepIndex < STEP_COUNT
          ) {
            setStepIndex(saved.stepIndex);
          }
        }
      }
    } catch {
      // Corrupt or unavailable storage (private mode, blocked): start fresh.
    } finally {
      setHydrated(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist progress so a reload/close/offline mid-flow doesn't lose it.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          draft,
          mediaLeanChosen,
          stepIndex,
        } satisfies PersistedState),
      );
    } catch {
      // Ignore write failures (private mode, quota exceeded).
    }
  }, [hydrated, draft, mediaLeanChosen, stepIndex]);

  const actions = useMemo(
    () => ({
      setMediaLean: (value: MediaLean) => {
        setMediaLeanChosen(true);
        setDraft((prev) => ({ ...prev, mediaLean: value }));
      },
      toggleGenre: (genreId: number) =>
        setDraft((prev) => ({
          ...prev,
          genreIds: toggle(prev.genreIds, genreId, GENRE_MAX),
        })),
      toggleLanguage: (code: string) =>
        setDraft((prev) => ({
          ...prev,
          languages: toggle(prev.languages, code, LANGUAGE_MAX),
        })),
      toggleEra: (era: string) =>
        setDraft((prev) => ({
          ...prev,
          eras: toggle(prev.eras, era, prev.eras.length + 1),
        })),
      setMinRating: (value: number | null) =>
        setDraft((prev) => ({ ...prev, minRating: value })),
    }),
    [],
  );

  const addedTitleCount = addedTitleKeys.size;
  const canFinish = addedTitleCount >= MIN_WATCHLIST_TITLES;

  const canProceed = useMemo(() => {
    if (stepIndex === 0) return mediaLeanChosen;
    if (stepIndex === 1) return draft.genreIds.length >= 1;
    if (stepIndex === 2) return draft.languages.length >= 1;
    return true; // era-rating is skippable (titles is the gated last step)
  }, [stepIndex, mediaLeanChosen, draft.genreIds.length, draft.languages.length]);

  const next = useCallback(
    () => setStepIndex((i) => Math.min(i + 1, STEP_COUNT - 1)),
    [],
  );
  const back = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), []);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save preferences");
      }
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore: preferences already saved server-side.
      }
      window.location.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save preferences",
      );
      setIsSubmitting(false);
    }
  }, [draft]);

  return {
    stepIndex,
    stepCount: STEP_COUNT,
    isLastStep: stepIndex === STEP_COUNT - 1,
    draft,
    actions,
    canProceed,
    mediaLeanChosen,
    hydrated,
    isSubmitting,
    errorMessage,
    addedTitleKeys,
    markTitleAdded,
    addedTitleCount,
    canFinish,
    minWatchlistTitles: MIN_WATCHLIST_TITLES,
    next,
    back,
    submit,
  };
}
