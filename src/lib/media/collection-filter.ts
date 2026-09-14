import type {
  CollectionFilterItem,
  CollectionSortItem,
  CustomCollectionWithFilters,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";

export function getReleaseYear(
  item: LibraryMovie | LibrarySeries,
): number | null {
  if ("release_date" in item && item.release_date) {
    const year = parseInt(item.release_date.slice(0, 4), 10);
    return isNaN(year) ? null : year;
  }
  if ("first_air_date" in item && item.first_air_date) {
    const year = parseInt(item.first_air_date.slice(0, 4), 10);
    return isNaN(year) ? null : year;
  }
  return null;
}

export function matchesFilter(
  item: LibraryMovie | LibrarySeries,
  filter: CollectionFilterItem,
): boolean {
  const { field, operator, value } = filter;
  const targetValue = value.trim().toLowerCase();

  switch (field) {
    case "release_year": {
      const year = getReleaseYear(item);
      const targetYear = parseInt(targetValue, 10);
      if (year === null || isNaN(targetYear)) return false;

      switch (operator) {
        case 0: // eq
          return year === targetYear;
        case 1: // neq
          return year !== targetYear;
        case 2: // gt
          return year > targetYear;
        case 3: // lt
          return year < targetYear;
        default:
          return false;
      }
    }

    case "certification": {
      const cert = (item.certificate || "").trim().toLowerCase();
      if (!cert) return false;

      switch (operator) {
        case 0: // eq
          return cert === targetValue;
        case 1: // neq
          return cert !== targetValue;
        case 4: // in
          return cert.includes(targetValue);
        default:
          return false;
      }
    }

    case "original_language": {
      const lang = (item.original_language || "").trim().toLowerCase();
      if (!lang) return false;

      switch (operator) {
        case 0: // eq
          return lang === targetValue;
        case 1: // neq
          return lang !== targetValue;
        case 4: // in
          return lang.includes(targetValue);
        default:
          return false;
      }
    }

    case "origin_country": {
      const country = (item.origin_country || "").trim().toLowerCase();
      if (!country) return false;

      switch (operator) {
        case 0: // eq
          return country === targetValue;
        case 1: // neq
          return country !== targetValue;
        case 4: // in
          return country.includes(targetValue);
        default:
          return false;
      }
    }

    case "genre": {
      const genres = (item.genres || []).map((g) => g.trim().toLowerCase());
      if (genres.length === 0) return false;

      switch (operator) {
        case 0: // eq
        case 4: // in
          return genres.some(
            (g) => g === targetValue || g.includes(targetValue),
          );
        case 1: // neq
          return !genres.some(
            (g) => g === targetValue || g.includes(targetValue),
          );
        default:
          return false;
      }
    }

    default:
      return true;
  }
}

export function sortItems<T extends LibraryMovie | LibrarySeries>(
  items: T[],
  sorts?: CollectionSortItem[],
): T[] {
  if (!sorts || sorts.length === 0) {
    return items;
  }

  const sorted = [...items];
  const sort = sorts[0]; // Primary sort
  const isAsc = sort.direction === 0;

  sorted.sort((a, b) => {
    let valA: string | number | null = null;
    let valB: string | number | null = null;

    if (sort.field === "release_date") {
      valA = getReleaseYear(a) ?? 0;
      valB = getReleaseYear(b) ?? 0;
    } else if (sort.field === "vote_average") {
      valA = a.vote_average ?? 0;
      valB = b.vote_average ?? 0;
    } else if (sort.field === "title") {
      valA = ("title" in a ? a.title : a.name).toLowerCase();
      valB = ("title" in b ? b.title : b.name).toLowerCase();
    } else if (sort.field === "created_at") {
      valA = a.created_at ?? "";
      valB = b.created_at ?? "";
    }

    if (valA === null && valB === null) return 0;
    if (valA === null) return 1;
    if (valB === null) return -1;

    if (typeof valA === "number" && typeof valB === "number") {
      return isAsc ? valA - valB : valB - valA;
    }

    const strA = String(valA);
    const strB = String(valB);
    return isAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });

  return sorted;
}

export function filterCollectionItems(
  collection: CustomCollectionWithFilters,
  movies: LibraryMovie[],
  series: LibrarySeries[],
): (LibraryMovie | LibrarySeries)[] {
  // 0 = movie, 1 = series
  let candidates: (LibraryMovie | LibrarySeries)[] = [];
  if (collection.mediaType === 0) {
    candidates = movies;
  } else if (collection.mediaType === 1) {
    candidates = series;
  } else {
    candidates = [...movies, ...series];
  }

  const filtered = candidates.filter((item) =>
    collection.filters.every((filter) => matchesFilter(item, filter)),
  );

  return sortItems(filtered, collection.sorts);
}

