import {
  DEFAULT_LIBRARY_BROWSE_QUERY,
  LIBRARY_BROWSE_SESSION_KEY,
} from "@/lib/constants";
import { SMART_COLLECTIONS } from "@/lib/constants/api";
import { browseQueriesEqual } from "@/lib/media/library-browse";
import type { LibraryBrowseQuery, LibraryMediaType } from "@/lib/types";

export type LibraryBrowseMediaSession = {
  query: LibraryBrowseQuery;
  selectedCollectionId: number | null;
};

export type LibraryBrowseSession = Record<
  LibraryMediaType,
  LibraryBrowseMediaSession
>;

const MEDIA_TYPES: LibraryMediaType[] = ["movie", "series"];

const VALID_SORT_FIELDS = new Set(
  Object.keys(SMART_COLLECTIONS.sort_field),
) as Set<LibraryBrowseQuery["sortField"]>;
const VALID_FILTER_FIELDS = new Set(
  Object.values(SMART_COLLECTIONS.filter_field).map((field) => field.value),
) as Set<NonNullable<LibraryBrowseQuery["filterField"]>>;
const VALID_OPERATORS = new Set([0, 1, 2, 3, 4]);
const VALID_GROUP_BY = new Set([0, 1, 2]);
const VALID_DIRECTIONS = new Set([0, 1]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseQuery(value: unknown): LibraryBrowseQuery | null {
  if (!isRecord(value)) {
    return null;
  }

  const sortField = value.sortField;
  const sortDirection = value.sortDirection;

  if (
    typeof sortField !== "string" ||
    !VALID_SORT_FIELDS.has(sortField as LibraryBrowseQuery["sortField"]) ||
    typeof sortDirection !== "number" ||
    !VALID_DIRECTIONS.has(sortDirection)
  ) {
    return null;
  }

  const query: LibraryBrowseQuery = {
    q: typeof value.q === "string" ? value.q : "",
    sortField: sortField as LibraryBrowseQuery["sortField"],
    sortDirection: sortDirection as LibraryBrowseQuery["sortDirection"],
  };

  if (value.filterField !== undefined) {
    if (
      typeof value.filterField !== "string" ||
      !VALID_FILTER_FIELDS.has(
        value.filterField as NonNullable<LibraryBrowseQuery["filterField"]>,
      )
    ) {
      return query;
    }

    query.filterField = value.filterField as LibraryBrowseQuery["filterField"];

    if (
      typeof value.filterOperator === "number" &&
      VALID_OPERATORS.has(value.filterOperator)
    ) {
      query.filterOperator =
        value.filterOperator as LibraryBrowseQuery["filterOperator"];
    }

    if (typeof value.filterValue === "string" && value.filterValue.length > 0) {
      query.filterValue = value.filterValue;
    }
  }

  if (value.groupBy !== undefined) {
    if (
      typeof value.groupBy === "number" &&
      VALID_GROUP_BY.has(value.groupBy)
    ) {
      query.groupBy = value.groupBy as LibraryBrowseQuery["groupBy"];
    }
  }

  return query;
}

function parseCollectionId(value: unknown): number | null {
  if (value === null) {
    return null;
  }

  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  ) {
    return value;
  }

  return null;
}

function createDefaultMediaSession(): LibraryBrowseMediaSession {
  return {
    query: DEFAULT_LIBRARY_BROWSE_QUERY,
    selectedCollectionId: null,
  };
}

function createDefaultSession(): LibraryBrowseSession {
  return {
    movie: createDefaultMediaSession(),
    series: createDefaultMediaSession(),
  };
}

function parseMediaSession(value: unknown): LibraryBrowseMediaSession | null {
  if (!isRecord(value)) {
    return null;
  }

  const query = parseQuery(value.query);
  if (!query) {
    return null;
  }

  return {
    query,
    selectedCollectionId: parseCollectionId(value.selectedCollectionId),
  };
}

function parseLegacySession(value: Record<string, unknown>): LibraryBrowseSession {
  const query = parseQuery(value.query) ?? DEFAULT_LIBRARY_BROWSE_QUERY;
  const selectedCollectionId = parseCollectionId(value.selectedCollectionId);

  return {
    movie: { query, selectedCollectionId },
    series: createDefaultMediaSession(),
  };
}

function parseSession(value: unknown): LibraryBrowseSession | null {
  if (!isRecord(value)) {
    return null;
  }

  if ("movie" in value || "series" in value) {
    const session = createDefaultSession();

    for (const mediaType of MEDIA_TYPES) {
      const parsed = parseMediaSession(value[mediaType]);
      if (parsed) {
        session[mediaType] = parsed;
      }
    }

    return session;
  }

  if ("query" in value) {
    return parseLegacySession(value);
  }

  return null;
}

function readSessionStorage(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionStorage(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

function removeSessionStorage(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

export function isDefaultLibraryBrowseMediaSession(
  session: LibraryBrowseMediaSession,
) {
  return (
    session.selectedCollectionId === null &&
    browseQueriesEqual(session.query, DEFAULT_LIBRARY_BROWSE_QUERY)
  );
}

export function isDefaultLibraryBrowseSession(session: LibraryBrowseSession) {
  return MEDIA_TYPES.every((mediaType) =>
    isDefaultLibraryBrowseMediaSession(session[mediaType]),
  );
}

export function readLibraryBrowseSession(): LibraryBrowseSession | null {
  const raw = readSessionStorage(LIBRARY_BROWSE_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return parseSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLibraryBrowseSession(session: LibraryBrowseSession) {
  if (isDefaultLibraryBrowseSession(session)) {
    removeSessionStorage(LIBRARY_BROWSE_SESSION_KEY);
    return;
  }

  writeSessionStorage(
    LIBRARY_BROWSE_SESSION_KEY,
    JSON.stringify(session),
  );
}
