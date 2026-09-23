import {
  and,
  asc,
  desc,
  eq,
  exists,
  not,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";
import { getDb } from "@/db";
import {
  genres,
  movies,
  moviesToGenres,
  series,
  seriesToGenres,
  userMovies,
  userSeries,
} from "@/db/schema";
import type { LibraryQueryInput } from "@/lib/validations/library";

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function likeContains(column: SQLWrapper, value: string) {
  const pattern = `%${escapeLike(value.toLowerCase())}%`;
  return sql`lower(${column}) LIKE ${pattern} ESCAPE '\\'`;
}

function splitValues(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function textCompare(column: SQLWrapper, operator: number, value: string) {
  const parts = splitValues(value).map((part) => part.toLowerCase());
  if (parts.length === 0) {
    return sql`1 = 0`;
  }

  if (operator === 4) {
    return sql`lower(${column}) in (${sql.join(
      parts.map((part) => sql`${part}`),
      sql`, `,
    )})`;
  }

  if (operator === 1) {
    return sql`lower(${column}) != ${parts[0]}`;
  }

  return sql`lower(${column}) = ${parts[0]}`;
}

const IMPRESSION_NONE = "none";

function impressionCompare(
  column: SQLWrapper,
  operator: number,
  value: string,
) {
  const parts = splitValues(value);
  const hasNone = parts.includes(IMPRESSION_NONE);
  const numericParts = parts
    .filter((part) => part !== IMPRESSION_NONE)
    .map((part) => Number(part))
    .filter((part) => !Number.isNaN(part));

  if (operator === 4) {
    const conditions: SQL[] = [];
    if (hasNone) {
      conditions.push(sql`${column} IS NULL`);
    }
    if (numericParts.length > 0) {
      conditions.push(
        sql`${column} in (${sql.join(
          numericParts.map((part) => sql`${part}`),
          sql`, `,
        )})`,
      );
    }
    if (conditions.length === 0) {
      return sql`1 = 0`;
    }
    if (conditions.length === 1) {
      return conditions[0]!;
    }
    return sql`(${sql.join(conditions, sql` OR `)})`;
  }

  if (value === IMPRESSION_NONE || parts[0] === IMPRESSION_NONE) {
    if (operator === 0) return sql`${column} IS NULL`;
    if (operator === 1) return sql`${column} IS NOT NULL`;
    return sql`1 = 0`;
  }

  return numericCompare(column, operator, value);
}

function numericCompare(column: SQLWrapper, operator: number, value: string) {
  const parsedParts = splitValues(value)
    .map((part) => Number(part))
    .filter((part) => !Number.isNaN(part));

  if (operator === 4) {
    if (parsedParts.length === 0) {
      return sql`1 = 0`;
    }
    return sql`${column} in (${sql.join(
      parsedParts.map((part) => sql`${part}`),
      sql`, `,
    )})`;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return sql`1 = 0`;
  }

  if (operator === 1) return sql`${column} != ${parsed}`;
  if (operator === 2) return sql`${column} > ${parsed}`;
  if (operator === 3) return sql`${column} < ${parsed}`;
  return sql`${column} = ${parsed}`;
}

function genreCondition(
  mediaType: "movie" | "series",
  operator: number,
  value: string,
) {
  const db = getDb();
  const joinTable = mediaType === "movie" ? moviesToGenres : seriesToGenres;
  const parentId =
    mediaType === "movie" ? moviesToGenres.movieId : seriesToGenres.seriesId;
  const catalogId = mediaType === "movie" ? movies.id : series.id;
  const nameMatch = textCompare(genres.name, operator === 1 ? 0 : operator, value);

  const matched = exists(
    db
      .select({ id: joinTable.id })
      .from(joinTable)
      .innerJoin(genres, eq(joinTable.genreId, genres.id))
      .where(and(eq(parentId, catalogId), nameMatch)),
  );

  return operator === 1 ? not(matched) : matched;
}

function releaseYearColumn(dateColumn: SQLWrapper) {
  return sql`CAST(substr(${dateColumn}, 1, 4) AS INTEGER)`;
}

function buildFilterCondition(
  mediaType: "movie" | "series",
  field: NonNullable<LibraryQueryInput["filter_field"]>,
  operator: number,
  value: string,
) {
  const catalog = mediaType === "movie" ? movies : series;
  const user = mediaType === "movie" ? userMovies : userSeries;
  const dateColumn =
    mediaType === "movie" ? movies.releaseDate : series.firstAirDate;

  switch (field) {
    case "watch_status":
      return numericCompare(user.watchStatus, operator, value);
    case "impression":
      return impressionCompare(user.impression, operator, value);
    case "vote_average":
      return numericCompare(catalog.voteAverage, operator, value);
    case "release_year":
      return numericCompare(releaseYearColumn(dateColumn), operator, value);
    case "status":
      return textCompare(catalog.status, operator, value);
    case "original_language":
      return textCompare(catalog.originalLanguage, operator, value);
    case "origin_country":
      return textCompare(catalog.originCountry, operator, value);
    case "genre":
      return genreCondition(mediaType, operator, value);
    default:
      return undefined;
  }
}

function multiFilterCondition(
  mediaType: "movie" | "series",
  clauses: NonNullable<LibraryQueryInput["filters"]>,
) {
  const conditions = clauses
    .map((clause) =>
      buildFilterCondition(
        mediaType,
        clause.field,
        clause.operator,
        clause.value,
      ),
    )
    .filter((part): part is SQL => part !== undefined);

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}

function filterCondition(
  mediaType: "movie" | "series",
  query: LibraryQueryInput,
) {
  if (query.filters && query.filters.length > 0) {
    return multiFilterCondition(mediaType, query.filters);
  }

  if (
    !query.filter_field ||
    query.filter_operator === undefined ||
    !query.filter_value
  ) {
    return undefined;
  }

  return buildFilterCondition(
    mediaType,
    query.filter_field,
    query.filter_operator,
    query.filter_value,
  );
}

function searchCondition(mediaType: "movie" | "series", query: LibraryQueryInput) {
  if (!query.q) {
    return undefined;
  }

  const titleColumn = mediaType === "movie" ? movies.title : series.name;
  return likeContains(titleColumn, query.q);
}

export function libraryTotalWhere(
  mediaType: "movie" | "series",
  userId: number,
) {
  const userIdColumn =
    mediaType === "movie" ? userMovies.userId : userSeries.userId;
  return eq(userIdColumn, userId);
}

export function libraryWhere(
  mediaType: "movie" | "series",
  userId: number,
  query: LibraryQueryInput,
) {
  const parts = [
    libraryTotalWhere(mediaType, userId),
    searchCondition(mediaType, query),
    filterCondition(mediaType, query),
  ].filter((part): part is SQL => part !== undefined);

  return and(...parts);
}

function groupKeyExpression(mediaType: "movie" | "series", groupBy: 0 | 1 | 2) {
  const user = mediaType === "movie" ? userMovies : userSeries;
  const catalog = mediaType === "movie" ? movies : series;

  if (groupBy === 0) {
    return sql<string>`cast(${user.watchStatus} as text)`;
  }

  if (groupBy === 1) {
    return sql<string>`coalesce(cast(${user.impression} as text), 'none')`;
  }

  return sql<string>`coalesce(${catalog.status}, 'Unknown')`;
}

function sortExpression(mediaType: "movie" | "series", query: LibraryQueryInput) {
  const user = mediaType === "movie" ? userMovies : userSeries;
  const catalog = mediaType === "movie" ? movies : series;
  const titleColumn = mediaType === "movie" ? movies.title : series.name;
  const dateColumn =
    mediaType === "movie" ? movies.releaseDate : series.firstAirDate;
  const direction = query.sort_direction === 0 ? asc : desc;

  switch (query.sort_field) {
    case "release_date":
      return direction(dateColumn);
    case "title":
      return direction(titleColumn);
    case "vote_average":
      return direction(catalog.voteAverage);
    case "completed_at":
      return direction(user.completedAt);
    case "last_watched_at":
      return mediaType === "series"
        ? direction(userSeries.lastWatchedAt)
        : sql`null`;
    case "created_at":
    default:
      return direction(user.createdAt);
  }
}

export function libraryOrderBy(
  mediaType: "movie" | "series",
  query: LibraryQueryInput,
) {
  const orders: SQL[] = [];

  if (query.group_by === 1) {
    const impressionKey = groupKeyExpression(mediaType, 1);
    orders.push(
      sql`CASE ${impressionKey} WHEN '2' THEN 0 WHEN '1' THEN 1 WHEN '0' THEN 2 WHEN 'none' THEN 3 ELSE 4 END`,
    );
  } else if (query.group_by === 0) {
    const user = mediaType === "movie" ? userMovies : userSeries;
    orders.push(asc(user.watchStatus));
  } else if (query.group_by === 2) {
    orders.push(asc(groupKeyExpression(mediaType, 2)));
  }

  orders.push(sortExpression(mediaType, query) as SQL);
  return orders;
}

export function libraryGroupKey(
  mediaType: "movie" | "series",
  query: LibraryQueryInput,
) {
  if (query.group_by === undefined) {
    return undefined;
  }

  return groupKeyExpression(mediaType, query.group_by);
}

export function librarySortOrder(
  mediaType: "movie" | "series",
  query: LibraryQueryInput,
) {
  return [sortExpression(mediaType, query) as SQL];
}

export function libraryGroupMatch(
  mediaType: "movie" | "series",
  query: LibraryQueryInput,
  groupKey?: string,
) {
  const key = groupKey ?? query.group_key;
  if (query.group_by === undefined || !key) {
    return undefined;
  }

  return sql`${groupKeyExpression(mediaType, query.group_by)} = ${key}`;
}
