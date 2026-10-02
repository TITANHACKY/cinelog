"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "cinelog-theme";
const THEME_COLORS = {
  light: "#dce5ee",
  dark: "#121314",
} as const;

function getThemeSnapshot(): Theme {
  return "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function updateThemeColor(theme: Theme) {
  const color = THEME_COLORS[theme];
  document
    .querySelector<HTMLMetaElement>(
      `meta[name="theme-color"][media*="${theme}"]`,
    )
    ?.setAttribute("content", color);
}

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  updateThemeColor(theme);
}

function subscribe(callback: () => void) {
  const handleStorage = () => {
    applyThemeToDocument("dark");
    callback();
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerSnapshot,
  );

  const applyTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      applyThemeToDocument(newTheme);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignored if localStorage is restricted
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const currentTheme = getThemeSnapshot();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }, [applyTheme]);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
    setTheme: applyTheme,
    mounted: true,
  };
}
