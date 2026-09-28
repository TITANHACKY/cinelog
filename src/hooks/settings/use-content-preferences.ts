"use client";

import { useCallback, useMemo, useState } from "react";
import { GENRE_MAX, LANGUAGE_MAX } from "@/lib/constants";
import type { MediaLean, UserPreferencesInput } from "@/lib/types";
import { apiErrorMessage } from "@/store/api/base-api";
import {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} from "@/store/api/user-api";
import { useAppDispatch } from "@/store";
import { showToast } from "@/store/slices/toastSlice";

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

export function useContentPreferences() {
  const dispatch = useAppDispatch();
  const preferences = useGetPreferencesQuery();
  const [updatePreferences, { isLoading: isSaving }] =
    useUpdatePreferencesMutation();
  const [draft, setDraft] = useState<UserPreferencesInput>(emptyDraft);
  const [seeded, setSeeded] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (preferences.data && !seeded) {
    setDraft(preferences.data);
    setSeeded(true);
  }

  const actions = useMemo(
    () => ({
      setMediaLean: (value: MediaLean) =>
        setDraft((current) => ({ ...current, mediaLean: value })),
      toggleGenre: (id: number) =>
        setDraft((current) => ({
          ...current,
          genreIds: toggle(current.genreIds, id, GENRE_MAX),
        })),
      toggleLanguage: (code: string) =>
        setDraft((current) => ({
          ...current,
          languages: toggle(current.languages, code, LANGUAGE_MAX),
        })),
      toggleEra: (era: string) =>
        setDraft((current) => ({
          ...current,
          eras: toggle(current.eras, era, current.eras.length + 1),
        })),
      setMinRating: (value: number | null) =>
        setDraft((current) => ({ ...current, minRating: value })),
    }),
    [],
  );

  const save = useCallback(async () => {
    setMessage(null);
    try {
      await updatePreferences(draft).unwrap();
      dispatch(showToast({ message: "Preferences updated", variant: "info" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: apiErrorMessage(error, "Failed to save preferences"),
      });
    }
  }, [dispatch, draft, updatePreferences]);

  return {
    draft,
    actions,
    isLoading: preferences.isLoading,
    isSaving,
    message,
    save,
  };
}
