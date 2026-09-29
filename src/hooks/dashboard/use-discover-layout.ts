"use client";

import type { DiscoverLayoutReady } from "@/lib/types";
import { apiErrorMessage } from "@/store/api/base-api";
import { useGetDiscoverLayoutQuery } from "@/store/api/discover-api";
import { useAppSelector } from "@/store";

export function useDiscoverLayout() {
  // Wait for the session user so disabled users never send the request.
  const userLoaded = useAppSelector((state) => state.auth.user !== null);
  const enabledInProfile = useAppSelector(
    (state) => state.auth.user?.discoverRowsEnabled !== false,
  );
  const result = useGetDiscoverLayoutQuery(undefined, {
    skip: !userLoaded || !enabledInProfile,
    // Database-only and cheap; picks up a new "Because" seed on each visit.
    refetchOnMountOrArgChange: true,
  });
  const data = result.data;
  const layout: DiscoverLayoutReady | null = data && data.enabled ? data : null;

  return {
    enabled: userLoaded && enabledInProfile && (data?.enabled ?? true),
    layout,
    isLoading: !userLoaded || result.isLoading,
    // RTK keeps `error` while a retry is pending, so the error stays up.
    errorMessage: result.error
      ? apiErrorMessage(result.error, "Couldn't load recommendations.")
      : null,
    isRetrying: Boolean(result.error) && result.isFetching,
    retry: () => {
      void result.refetch();
    },
  };
}
