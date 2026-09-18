import type { SagaIterator } from "redux-saga";
import { call, put, takeLatest } from "redux-saga/effects";
import {
  searchFailed,
  searchRequested,
  searchSucceeded,
  type SearchMediaType,
  type SearchResult,
} from "./searchSlice";

type SearchResponse = {
  error?: string;
  results?: SearchResult[];
  page?: number;
  total_pages?: number;
  total_results?: number;
};

function buildSearchUrl({
  mediaType,
  query,
  year,
  language,
  page,
}: ReturnType<typeof searchRequested>["payload"]) {
  const params = new URLSearchParams({
    query,
    page: String(page),
  });

  if (year !== undefined) {
    params.set("year", String(year));
  }

  if (language) {
    params.set("language", language);
  }

  return `/api/search/${mediaType}?${params.toString()}`;
}

function* fetchSearchResults(
  action: ReturnType<typeof searchRequested>,
): SagaIterator {
  const { mediaType, query } = action.payload;

  try {
    const response: Response = yield call(fetch, buildSearchUrl(action.payload));
    const data: SearchResponse = yield call([response, "json"]);

    if (!response.ok) {
      throw new Error(data.error ?? "Search request failed");
    }

    yield put(
      searchSucceeded({
        mediaType,
        query,
        results: data.results ?? [],
        page: data.page ?? action.payload.page,
        total_pages: data.total_pages ?? 1,
        total_results: data.total_results ?? (data.results ?? []).length,
      }),
    );
  } catch (error) {
    yield put(
      searchFailed({
        error: error instanceof Error ? error.message : "Search request failed",
        mediaType,
        query,
      }),
    );
  }
}

export function* searchSaga(): SagaIterator {
  yield takeLatest(searchRequested.type, fetchSearchResults);
}

export type { SearchMediaType };
