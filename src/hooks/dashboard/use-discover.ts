"use client";

import { apiErrorMessage } from "@/store/api/base-api";
import { useGetDiscoverQuery } from "@/store/api/discover-api";
import { useAppSelector } from "@/store";

export function useDiscover() {
  // Wait for the session user so disabled users never send the request.
  const userLoaded = useAppSelector((state) => state.auth.user !== null);
  const enabledInProfile = useAppSelector(
    (state) => state.auth.user?.discoverRowsEnabled !== false,
  );
  const result = useGetDiscoverQuery(undefined, {
    skip: !userLoaded || !enabledInProfile,
    refetchOnMountOrArgChange: 300,
  });
  const rows = result.data?.rows ?? [];

  return {
    enabled: userLoaded && enabledInProfile && (result.data?.enabled ?? true),
    rows,
    hasRows: rows.length > 0,
    isLoading: !userLoaded || result.isLoading,
    errorMessage: result.isError
      ? apiErrorMessage(result.error, "Couldn't load recommendations.")
      : null,
    retry: () => {
      void result.refetch();
    },
  };
}
