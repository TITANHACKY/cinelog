"use client";

import { apiErrorMessage } from "@/store/api/base-api";
import type { ContentMediaType } from "@/store/api/content-types";
import { useGetContentDetailsQuery } from "@/store/api/content-details-api";

type ContentDetailsState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  retry: () => void;
};

export function useContentDetails<T>(
  mediaType: ContentMediaType,
  id: string,
): ContentDetailsState<T> {
  const result = useGetContentDetailsQuery({ mediaType, id });

  return {
    data: (result.data as T | undefined) ?? null,
    error: result.isError
      ? new Error(
          apiErrorMessage(result.error, "Content details request failed"),
        )
      : null,
    isLoading: result.isLoading,
    retry: () => {
      void result.refetch();
    },
  };
}
