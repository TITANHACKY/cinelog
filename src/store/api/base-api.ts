import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { apiFetch } from "@/lib/http/client";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

type RequestArgs = {
  url: string;
  method?: string;
  body?: unknown;
  cache?: RequestCache;
};

function unwrapPayload(json: unknown) {
  if (
    json &&
    typeof json === "object" &&
    "data" in json &&
    (json as { data?: unknown }).data != null
  ) {
    return (json as { data: unknown }).data;
  }
  return json;
}

export const apiBaseQuery: BaseQueryFn<
  RequestArgs,
  unknown,
  ApiError
> = async ({ url, method = "GET", body, cache }) => {
  try {
    const response = await apiFetch(url, {
      method,
      cache,
      headers:
        body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        json &&
        typeof json === "object" &&
        "error" in json &&
        typeof (json as { error?: unknown }).error === "string"
          ? (json as { error: string }).error
          : "Request failed";
      return {
        error: {
          status: response.status,
          message,
          details:
            json && typeof json === "object" && "details" in json
              ? (json as { details?: unknown }).details
              : undefined,
        },
      };
    }
    return { data: unwrapPayload(json) };
  } catch (error) {
    return {
      error: {
        status: 0,
        message: error instanceof Error ? error.message : "Request failed",
      },
    };
  }
};

export function apiErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export function settledErrorMessage(caught: unknown, fallback: string) {
  if (caught && typeof caught === "object" && "error" in caught) {
    return apiErrorMessage((caught as { error: unknown }).error, fallback);
  }
  return apiErrorMessage(caught, fallback);
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: apiBaseQuery,
  tagTypes: [
    "Library",
    "Collection",
    "CollectionCarousel",
    "Dashboard",
    "Collections",
    "ContentDetails",
    "Me",
    "Preferences",
    "Genres",
    "Locales",
    "Franchise",
    "Franchises",
  ],
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({}),
});

export const libraryTagIds = [
  "Library",
  "Collection",
  "CollectionCarousel",
  "Dashboard",
] as const;
