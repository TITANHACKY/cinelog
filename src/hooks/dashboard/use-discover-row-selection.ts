"use client";

import { useState } from "react";
import { resolveRowSelection, storedRowValue } from "@/lib/discover/selection";
import type { DiscoverMedia, DiscoverRowId } from "@/lib/types";

function storageKey(rowId: DiscoverRowId) {
  return `cinelog:discover:${rowId}`;
}

function readStored(rowId: DiscoverRowId): unknown {
  try {
    const raw = window.localStorage.getItem(storageKey(rowId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Rows mount only after the client-side layout request, so reading
// localStorage in the initializer cannot cause a hydration mismatch.
export function useDiscoverRowSelection(
  rowId: DiscoverRowId,
  options: {
    lockedMedia: DiscoverMedia | null;
    optionsFor: (media: DiscoverMedia) => string[];
  },
) {
  const [stored, setStored] = useState<unknown>(() => readStored(rowId));
  const selection = resolveRowSelection({ stored, ...options });

  function persist(next: { media: DiscoverMedia; value: string | null }) {
    setStored(next);
    try {
      window.localStorage.setItem(storageKey(rowId), JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode, quota): keep the in-memory choice.
    }
  }

  return {
    ...selection,
    // Keep the remembered value when switching media, so Thriller comes
    // back after a detour through Series.
    setMedia: (media: DiscoverMedia) =>
      persist({ media, value: storedRowValue(stored) ?? selection.value }),
    setValue: (value: string) => persist({ media: selection.media, value }),
  };
}
