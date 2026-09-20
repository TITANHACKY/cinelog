"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import { GENRE_MAX, LANGUAGE_MAX, SEED_TITLE_MAX } from "@/lib/constants";
import type { MediaLean, SeedTitle, UserPreferencesInput } from "@/lib/types";

const emptyDraft: UserPreferencesInput = {
  mediaLean: 2,
  minRating: null,
  eras: [],
  genreIds: [],
  languages: [],
  seedTitles: [],
};

function toggle<T>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((item) => item !== value);
  if (list.length >= max) return list;
  return [...list, value];
}

export function useContentPreferences() {
  const [draft, setDraft] = useState<UserPreferencesInput>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    apiFetch("/api/user/preferences")
      .then((res) => (res.ok ? res.json() : { preferences: null }))
      .then((json) => {
        if (!ignore && json.preferences)
          setDraft(json.preferences as UserPreferencesInput);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const actions = useMemo(
    () => ({
      setMediaLean: (value: MediaLean) =>
        setDraft((p) => ({ ...p, mediaLean: value })),
      toggleGenre: (id: number) =>
        setDraft((p) => ({ ...p, genreIds: toggle(p.genreIds, id, GENRE_MAX) })),
      toggleLanguage: (code: string) =>
        setDraft((p) => ({
          ...p,
          languages: toggle(p.languages, code, LANGUAGE_MAX),
        })),
      toggleEra: (era: string) =>
        setDraft((p) => ({ ...p, eras: toggle(p.eras, era, p.eras.length + 1) })),
      setMinRating: (value: number | null) =>
        setDraft((p) => ({ ...p, minRating: value })),
      addSeedTitle: (seed: SeedTitle) =>
        setDraft((p) =>
          p.seedTitles.some(
            (s) => s.tmdbId === seed.tmdbId && s.mediaType === seed.mediaType,
          ) || p.seedTitles.length >= SEED_TITLE_MAX
            ? p
            : { ...p, seedTitles: [...p.seedTitles, seed] },
        ),
      removeSeedTitle: (tmdbId: number, mediaType: 0 | 1) =>
        setDraft((p) => ({
          ...p,
          seedTitles: p.seedTitles.filter(
            (s) => !(s.tmdbId === tmdbId && s.mediaType === mediaType),
          ),
        })),
    }),
    [],
  );

  const save = useCallback(async () => {
    setIsSaving(true);
    setMessage(null);
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
      setMessage({ type: "success", text: "Preferences saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to save preferences",
      });
    } finally {
      setIsSaving(false);
    }
  }, [draft]);

  return { draft, actions, isLoading, isSaving, message, save };
}
