"use client";

import { apiErrorMessage } from "@/store/api/base-api";
import { useGetDiscoverQuery } from "@/store/api/discover-api";
import { useAppSelector } from "@/store";

export function useDiscover() {
  // Skip the request entirely for users who turned the rows off.
  const enabledInProfile = useAppSelector(
    (state) => state.auth.user?.discoverRowsEnabled !== false,
  );
  const result = useGetDiscoverQuery(undefined, {
    skip: !enabledInProfile,
    refetchOnMountOrArgChange: 300,
  });
  const rows = result.data?.rows ?? [];

  return {
    enabled: enabledInProfile && (result.data?.enabled ?? true),
    rows,
    hasRows: rows.length > 0,
    isLoading: result.isLoading,
    errorMessage: result.isError
      ? apiErrorMessage(result.error, "Couldn't load recommendations.")
      : null,
    retry: () => {
      void result.refetch();
    },
  };
}
