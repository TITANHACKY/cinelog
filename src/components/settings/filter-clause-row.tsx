"use client";

import { LibraryMultiSelect } from "@/components/library/library-multi-select";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { Input } from "@/components/ui/input";
import {
  IMPRESSION,
  LIBRARY_FILTER_FIELDS,
  LIBRARY_OPERATORS,
  LIBRARY_OPERATORS_BY_FIELD,
  MOVIE_STATUS,
  SERIES_STATUS,
  WATCH_STATUS,
} from "@/lib/constants";
import { useGenres } from "@/hooks/use-genres";
import { defaultFilterValue } from "@/lib/media/library-browse";
import {
  getSearchYears,
  getTmdbLanguageOptions,
  getTmdbRegionOptions,
} from "@/lib/search/filters";
import type { GenreOption } from "@/hooks/use-genres";
import type {
  CollectionFilterItem,
  LibraryFilterField,
  LibraryMediaType,
  LibraryOperator,
} from "@/lib/types";
import { toMovieStatusDisplay, toSeriesStatusDisplay } from "@/lib/media/status";

type FilterClauseRowProps = {
  clause: CollectionFilterItem;
  mediaType: LibraryMediaType;
  onUpdate: (
    field: keyof CollectionFilterItem,
    value: string | number,
  ) => void;
};

function splitFilterValues(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function filterValueOptions(
  field: LibraryFilterField | undefined,
  mediaType: LibraryMediaType,
  genres: GenreOption[],
) {
  if (field === "watch_status") {
    return Object.values(WATCH_STATUS).map((status) => ({
      value: String(status.value),
      label: status.display_value,
    }));
  }

  if (field === "impression") {
    return [
      { value: "none", label: "No Impression" },
      ...Object.values(IMPRESSION).map((impression) => ({
        value: String(impression.value),
        label: impression.display_value,
      })),
    ];
  }

  if (field === "status") {
    const statuses =
      mediaType === "movie"
        ? Object.values(MOVIE_STATUS)
        : Object.values(SERIES_STATUS);
    return statuses.map((status) => ({
      value: status.value,
      label: status.display_value,
    }));
  }

  if (field === "genre") {
    return genres.map((genre) => ({ value: genre.name, label: genre.name }));
  }

  if (field === "original_language") {
    return getTmdbLanguageOptions();
  }

  if (field === "origin_country") {
    return getTmdbRegionOptions();
  }

  if (field === "release_year") {
    return getSearchYears().map((year) => ({
      value: String(year),
      label: String(year),
    }));
  }

  return [];
}

export function FilterClauseRow({
  clause,
  mediaType,
  onUpdate,
}: FilterClauseRowProps) {
  const { genres } = useGenres();
  const field = clause.field as LibraryFilterField;
  const operatorOptions = LIBRARY_OPERATORS.filter((operator) =>
    LIBRARY_OPERATORS_BY_FIELD[field]?.includes(operator.value),
  );
  const isInOperator = clause.operator === 4;
  const valueOptions = filterValueOptions(field, mediaType, genres);
  const searchableValue =
    field === "genre" ||
    field === "original_language" ||
    field === "origin_country" ||
    field === "release_year";

  function updateFilterField(nextField: string) {
    if (!nextField) return;
    const filterField = nextField as LibraryFilterField;
    onUpdate("field", filterField);
    onUpdate("operator", LIBRARY_OPERATORS_BY_FIELD[filterField][0]!);
    onUpdate("value", defaultFilterValue(filterField, mediaType));
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-outline-alt/60 bg-surface-container p-2.5">
      <SearchFilterSelect
        aria-label="Filter field"
        heading="Filter"
        menuMinWidth={200}
        onChange={updateFilterField}
        options={LIBRARY_FILTER_FIELDS}
        placeholder="Field"
        triggerClassName="min-w-32"
        value={field}
      />
      <SearchFilterSelect
        aria-label="Filter operator"
        heading="Is"
        menuMinWidth={160}
        onChange={(value) => onUpdate("operator", Number(value) as LibraryOperator)}
        options={operatorOptions.map((operator) => ({
          value: String(operator.value),
          label: operator.label,
        }))}
        placeholder="Equals"
        triggerClassName="min-w-28"
        value={String(clause.operator)}
      />
      {field === "vote_average" ? (
        <Input
          aria-label="Filter value"
          className="h-8 w-28 bg-surface-container-high"
          inputMode="decimal"
          max={10}
          min={0}
          onChange={(event) => onUpdate("value", event.target.value)}
          step="0.1"
          type="number"
          value={clause.value}
        />
      ) : isInOperator ? (
        <LibraryMultiSelect
          aria-label="Filter values"
          heading="Value"
          menuMinWidth={200}
          onChange={(values) => onUpdate("value", values.join(",") || "")}
          options={valueOptions}
          placeholder="Select"
          searchable={searchableValue}
          triggerClassName="min-w-32"
          values={splitFilterValues(clause.value)}
        />
      ) : (
        <SearchFilterSelect
          aria-label="Filter value"
          heading="Value"
          menuMinWidth={200}
          onChange={(value) => onUpdate("value", value)}
          options={valueOptions.map((option) => ({
            value: option.value,
            label:
              field === "status" && mediaType === "movie"
                ? (toMovieStatusDisplay(option.value) ?? option.label)
                : field === "status"
                  ? (toSeriesStatusDisplay(option.value) ?? option.label)
                  : option.label,
          }))}
          placeholder="Select"
          searchable={searchableValue}
          triggerClassName="min-w-32"
          value={clause.value}
        />
      )}
    </div>
  );
}
