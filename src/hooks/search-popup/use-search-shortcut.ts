"use client";

import { useEffect, useSyncExternalStore } from "react";
import { APPLE_PLATFORM_PATTERN } from "@/lib/constants";

const subscribeToNothing = () => () => {};

function isApplePlatform() {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? navigator.platform;

  return APPLE_PLATFORM_PATTERN.test(platform || navigator.userAgent);
}

export function useSearchShortcut(onTrigger: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        event.key?.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);

      if (!isShortcut) {
        return;
      }

      event.preventDefault();
      onTrigger();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTrigger]);
}

export function useSearchShortcutLabel() {
  // The server snapshot is null so the label only appears once hydrated.
  return useSyncExternalStore(
    subscribeToNothing,
    () => (isApplePlatform() ? "⌘K" : "Ctrl K"),
    () => null,
  );
}
