"use client";

import { LibraryMultiSelect } from "@/components/library/library-multi-select";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  COMMON_GENRES,
  COMMON_LANGUAGES,
  IMPRESSION,
  LIBRARY_FILTER_FIELDS,
  LIBRARY_GROUP_OPTIONS,
  LIBRARY_OPERATORS,
  LIBRARY_OPERATORS_BY_FIELD,
  LIBRARY_SORT_OPTIONS,
  MOVIE_STATUS,
  SERIES_STATUS,
  TMDB_REGIONS,
  WATCH_STATUS,
} from "@/lib/constants";
import { defaultFilterValue } from "@/lib/media/library-browse";
import { getSearchYears } from "@/lib/search/filters";
import type {
  LibraryBrowseQuery,
  LibraryFilterField,
  LibraryMediaType,
  LibraryOperator,
} from "@/lib/types";

type LibraryBrowseFieldsProps = {
  mediaType: LibraryMediaType;
  query: LibraryBrowseQuery;
  layout?: "inline" | "stack";
  onChange: (query: LibraryBrowseQuery) => void;
};

const PICKER_TRIGGER = "min-w-36";
const PICKER_MENU_WIDTH = 224;

function splitFilterValues(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function filterValueOptions(
  field: LibraryFilterField | undefined,
  mediaType: LibraryMediaType,
) {
  if (field === "watch_status") {
    return Object.values(WATCH_STATUS).map((status) => ({
      value: String(status.value),
      label: status.display_value,
    }));
  }

  if (field === "impression") {
    return Object.values(IMPRESSION).map((impression) => ({
      value: String(impression.value),
      label: impression.display_value,
    }));
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
    return COMMON_GENRES.map((genre) => ({ value: genre, label: genre }));
  }

  if (field === "original_language") {
    return COMMON_LANGUAGES.map((language) => ({
      value: language.code,
      label: `${language.label} (${language.code})`,
    }));
  }

  if (field === "origin_country") {
    return TMDB_REGIONS.map((region) => ({
      value: region.iso_3166_1,
      label: region.english_name,
    }));
  }

  if (field === "release_year") {
    return getSearchYears().map((year) => ({
      value: String(year),
      label: String(year),
    }));
  }

  return [];
}

export function LibraryBrowseFields({
  mediaType,
  query,
  layout = "inline",
  onChange,
}: LibraryBrowseFieldsProps) {
  const operatorOptions = query.filterField
    ? LIBRARY_OPERATORS.filter((operator) =>
        LIBRARY_OPERATORS_BY_FIELD[query.filterField!].includes(operator.value),
      )
    : [];
  const isInOperator = query.filterOperator === 4;
  const usesPresetValue =
    Boolean(query.filterField) && query.filterField !== "vote_average";
  const sortOptions = LIBRARY_SORT_OPTIONS.filter(
    (option) => !option.seriesOnly || mediaType === "series",
  );
  const stacked = layout === "stack";
  const valueOptions = filterValueOptions(query.filterField, mediaType);
  const searchableValue =
    query.filterField === "genre" ||
    query.filterField === "original_language" ||
    query.filterField === "origin_country" ||
    query.filterField === "release_year";

  function updateFilterField(nextField: string) {
    if (!nextField) {
      onChange({
        ...query,
        filterField: undefined,
        filterOperator: undefined,
        filterValue: undefined,
      });
      return;
    }

    const field = nextField as LibraryFilterField;
    onChange({
      ...query,
      filterField: field,
      filterOperator: LIBRARY_OPERATORS_BY_FIELD[field][0],
      filterValue: defaultFilterValue(field, mediaType),
    });
  }

  function updateOperator(nextOperator: LibraryOperator) {
    const selected = splitFilterValues(query.filterValue);
    const nextValue =
      nextOperator === 4
        ? selected.join(",") || query.filterValue
        : selected[0] ?? query.filterValue;

    onChange({
      ...query,
      filterOperator: nextOperator,
      filterValue: nextValue,
    });
  }

  const filterFieldControl = (
    <SearchFilterSelect
      aria-label="Filter field"
      heading="Filter"
      menuMinWidth={PICKER_MENU_WIDTH}
      onChange={updateFilterField}
      options={[{ value: "", label: "Any" }, ...LIBRARY_FILTER_FIELDS]}
      placeholder="Any"
      triggerClassName={PICKER_TRIGGER}
      value={query.filterField ?? ""}
    />
  );

  const operatorControl = query.filterField ? (
    <SearchFilterSelect
      aria-label="Filter operator"
      heading="Is"
      menuMinWidth={PICKER_MENU_WIDTH}
      onChange={(value) => updateOperator(Number(value) as LibraryOperator)}
      options={operatorOptions.map((operator) => ({
        value: String(operator.value),
        label: operator.label,
      }))}
      placeholder="Equals"
      triggerClassName={PICKER_TRIGGER}
      value={
        query.filterOperator === undefined ? "" : String(query.filterOperator)
      }
    />
  ) : null;

  const valueControl = query.filterField ? (
    query.filterField === "vote_average" ? (
      <Input
        aria-label="Filter value"
        className="h-8 w-28 bg-surface-container-high sm:w-32"
        inputMode="decimal"
        max={10}
        min={0}
        onChange={(event) =>
          onChange({ ...query, filterValue: event.target.value })
        }
        placeholder="0–10"
        step="0.1"
        type="number"
        value={query.filterValue ?? ""}
      />
    ) : isInOperator ? (
      <LibraryMultiSelect
        aria-label="Filter values"
        heading="Value"
        menuMinWidth={PICKER_MENU_WIDTH}
        onChange={(values) =>
          onChange({ ...query, filterValue: values.join(",") || undefined })
        }
        options={valueOptions}
        placeholder="Select"
        searchPlaceholder="Search"
        searchable={searchableValue}
        triggerClassName={PICKER_TRIGGER}
        values={splitFilterValues(query.filterValue)}
      />
    ) : usesPresetValue ? (
      <SearchFilterSelect
        aria-label="Filter value"
        heading="Value"
        menuMinWidth={PICKER_MENU_WIDTH}
        onChange={(value) => onChange({ ...query, filterValue: value })}
        options={valueOptions}
        placeholder="Select"
        searchPlaceholder="Search"
        searchable={searchableValue}
        triggerClassName={PICKER_TRIGGER}
        value={query.filterValue ?? ""}
      />
    ) : null
  ) : null;

  const sortControl = (
    <SearchFilterSelect
      aria-label="Sort library"
      heading="Sort"
      menuMinWidth={PICKER_MENU_WIDTH}
      onChange={(value) => {
        const [field, direction] = value.split(":");
        onChange({
          ...query,
          sortField: field as LibraryBrowseQuery["sortField"],
          sortDirection: Number(direction) as LibraryBrowseQuery["sortDirection"],
        });
      }}
      options={sortOptions.map((option) => ({
        value: `${option.field}:${option.direction}`,
        label: option.label,
      }))}
      placeholder="Date added"
      triggerClassName={PICKER_TRIGGER}
      value={`${query.sortField}:${query.sortDirection}`}
    />
  );

  const groupControl = (
    <SearchFilterSelect
      aria-label="Group library"
      heading="Group"
      menuMinWidth={PICKER_MENU_WIDTH}
      onChange={(value) =>
        onChange({
          ...query,
          groupBy: value === "" ? undefined : (Number(value) as 0 | 1 | 2),
        })
      }
      options={LIBRARY_GROUP_OPTIONS}
      placeholder="None"
      triggerClassName={PICKER_TRIGGER}
      value={query.groupBy === undefined ? "" : String(query.groupBy)}
    />
  );

  if (stacked) {
    return (
      <div className="flex flex-col gap-4">
        <FormField id="library-filter-field" label="Filter">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {filterFieldControl}
            {operatorControl}
            {valueControl}
          </div>
        </FormField>
        <FormField id="library-sort" label="Sort">
          {sortControl}
        </FormField>
        <FormField id="library-group" label="Group">
          {groupControl}
        </FormField>
      </div>
    );
  }

  return (
    <>
      {filterFieldControl}
      {operatorControl}
      {valueControl}
      {sortControl}
      {groupControl}
    </>
  );
}
