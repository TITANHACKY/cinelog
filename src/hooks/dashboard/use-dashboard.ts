"use client";

import { apiErrorMessage } from "@/store/api/base-api";
import { useGetDashboardQuery } from "@/store/api/library-api";

export function useDashboard() {
  const result = useGetDashboardQuery(undefined, {
    refetchOnMountOrArgChange: 30,
  });

  return {
    isLoading: result.isLoading,
    errorMessage: result.isError
      ? apiErrorMessage(result.error, "Failed to load dashboard data.")
      : null,
    movieCount: result.data?.counts.movies ?? 0,
    seriesCount: result.data?.counts.series ?? 0,
    continueWatching: result.data?.continueWatching ?? [],
    collections: result.data?.collections ?? [],
  };
}
