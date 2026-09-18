"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchShortcut } from "@/hooks/search-popup/use-search-shortcut";
import type { SearchMediaType } from "@/components/search-popup/search-controls";
import { searchCleared, searchRequested } from "@/store/slices/searchSlice";
import { useAppDispatch, useAppSelector } from "@/store";

export function useSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<SearchMediaType>("movie");
  const [year, setYear] = useState<number>();
  const [language, setLanguage] = useState<string>();
  const [page, setPage] = useState(1);
  const dispatch = useAppDispatch();
  const searchState = useAppSelector((state) => state.search[mediaType]);

  const requestSearch = useCallback(
    (nextPage: number, nextQuery = query.trim()) => {
      dispatch(
        searchRequested({
          mediaType,
          query: nextQuery,
          year,
          language,
          page: nextPage,
        }),
      );
    },
    [dispatch, language, mediaType, query, year],
  );

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setQuery("");
      setYear(undefined);
      setLanguage(undefined);
      setPage(1);
    }
  }, []);

  const handleMediaTypeChange = useCallback((nextType: SearchMediaType) => {
    setMediaType(nextType);
    setPage(1);
  }, []);

  const handleQueryChange = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
  }, []);

  const handleYearChange = useCallback((nextYear?: number) => {
    setYear(nextYear);
    setPage(1);
  }, []);

  const handleLanguageChange = useCallback((nextLanguage?: string) => {
    setLanguage(nextLanguage);
    setPage(1);
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      requestSearch(nextPage);
    },
    [requestSearch],
  );

  useSearchShortcut(
    useCallback(() => handleOpenChange(!open), [handleOpenChange, open]),
  );

  const showPagination =
    searchState.total_pages > 1 &&
    (searchState.status === "success" || searchState.status === "loading");

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length <= 0) {
      dispatch(searchCleared(mediaType));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(
        searchRequested({
          mediaType,
          query: normalizedQuery,
          year,
          language,
          page: 1,
        }),
      );
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, language, mediaType, query, year]);

  return {
    open,
    query,
    mediaType,
    year,
    language,
    page,
    searchState,
    showPagination,
    requestSearch,
    handleOpenChange,
    handleMediaTypeChange,
    handleQueryChange,
    handleYearChange,
    handleLanguageChange,
    handlePageChange,
  };
}
