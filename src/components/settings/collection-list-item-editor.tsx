"use client";

import { FilterClauseRow } from "@/components/settings/filter-clause-row";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  LIBRARY_GROUP_OPTIONS,
  LIBRARY_SORT_OPTIONS,
} from "@/lib/constants";
import { defaultFilterValue } from "@/lib/media/library-browse";
import type {
  CollectionFilterItem,
  CollectionSortItem,
  CustomCollectionWithFilters,
  LibraryMediaType,
} from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type CollectionListItemEditorProps = {
  collection?: CustomCollectionWithFilters;
  onCancel: () => void;
  onSave: (payload: {
    name: string;
    mediaType: number;
    showInLibrary: boolean;
    showInDashboard: boolean;
    groupBy: number | null;
    filters: CollectionFilterItem[];
    sorts: CollectionSortItem[];
    editingId?: number;
  }) => Promise<boolean>;
};

const defaultSort = (): CollectionSortItem => ({
  field: "created_at",
  direction: 1,
  priority: 0,
});

export function CollectionListItemEditor({
  collection,
  onCancel,
  onSave,
}: CollectionListItemEditorProps) {
  const isEditing = Boolean(collection);
  const [name, setName] = useState(collection?.name ?? "");
  const [mediaType, setMediaType] = useState(collection?.mediaType ?? 0);
  const [showInLibrary, setShowInLibrary] = useState(
    collection?.showInLibrary ?? true,
  );
  const [showInDashboard, setShowInDashboard] = useState(
    collection?.showInDashboard ?? false,
  );
  const [groupBy, setGroupBy] = useState<number | null>(
    collection?.groupBy ?? null,
  );
  const [filter, setFilter] = useState<CollectionFilterItem>(
    collection?.filters[0] ?? {
      field: "genre",
      operator: 0,
      value: "Action",
    },
  );
  const [sort, setSort] = useState<CollectionSortItem>(
    collection?.sorts?.[0] ?? defaultSort(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaTypeKey: LibraryMediaType = mediaType === 0 ? "movie" : "series";
  const sortOptions = LIBRARY_SORT_OPTIONS.filter(
    (option) => !option.seriesOnly || mediaTypeKey === "series",
  );
  const groupDisabled = showInDashboard;
  const dashboardDisabled = groupBy !== null;

  function updateFilter(
    field: keyof CollectionFilterItem,
    value: string | number,
  ) {
    setFilter((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Collection name is required.");
      return;
    }
    if (!filter.value.trim()) {
      setError("Filter value is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const saved = await onSave({
      name: name.trim(),
      mediaType,
      showInLibrary,
      showInDashboard,
      groupBy: showInDashboard ? null : groupBy,
      filters: [filter],
      sorts: [sort],
      editingId: collection?.id,
    });
    setIsSubmitting(false);
    if (saved) {
      onCancel();
    }
  }

  return (
    <div className="space-y-4 border-t border-outline-alt/60 pt-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField id="collection-name" label="Name">
          <Input
            className="border-outline-alt bg-surface-container"
            id="collection-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Collection name"
            value={name}
          />
        </FormField>
        <FormField id="collection-media-type" label="Media type">
          <select
            className="h-8 w-full rounded-lg border border-outline-alt bg-surface-container px-2.5 font-public-sans text-xs text-on-surface outline-none"
            id="collection-media-type"
            onChange={(event) => {
              const next = Number(event.target.value);
              setMediaType(next);
              const nextMedia: LibraryMediaType = next === 0 ? "movie" : "series";
              setFilter({
                field: "genre",
                operator: 0,
                value: defaultFilterValue("genre", nextMedia),
              });
            }}
            value={mediaType}
          >
            <option value={0}>Movies</option>
            <option value={1}>Series</option>
          </select>
        </FormField>
      </div>

      <FormField id="collection-filter" label="Filter">
        <FilterClauseRow
          clause={filter}
          mediaType={mediaTypeKey}
          onUpdate={updateFilter}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField id="collection-sort" label="Sort">
          <SearchFilterSelect
            aria-label="Sort collection"
            heading="Sort"
            menuMinWidth={220}
            onChange={(value) => {
              const [field, direction] = value.split(":");
              setSort({
                field,
                direction: Number(direction),
                priority: 0,
              });
            }}
            options={sortOptions.map((option) => ({
              value: `${option.field}:${option.direction}`,
              label: option.label,
            }))}
            placeholder="Sort"
            triggerClassName="min-w-full"
            value={`${sort.field}:${sort.direction}`}
          />
        </FormField>
        <FormField id="collection-group" label="Group">
          <SearchFilterSelect
            aria-label="Group collection"
            disabled={groupDisabled}
            heading="Group"
            menuMinWidth={220}
            onChange={(value) =>
              setGroupBy(value === "" ? null : Number(value))
            }
            options={LIBRARY_GROUP_OPTIONS}
            placeholder="None"
            triggerClassName="min-w-full"
            value={groupBy === null ? "" : String(groupBy)}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2.5">
          <ToggleSwitch
            checked={showInLibrary}
            onChange={() => setShowInLibrary((prev) => !prev)}
            title="Show in library preset dropdown"
          />
          <span className="font-public-sans text-xs text-on-surface">
            Show in library
          </span>
        </label>
        <label className="flex items-center gap-2.5">
          <ToggleSwitch
            checked={showInDashboard}
            disabled={dashboardDisabled}
            onChange={() =>
              setShowInDashboard((prev) => {
                const next = !prev;
                if (next) setGroupBy(null);
                return next;
              })
            }
            title={
              dashboardDisabled
                ? "Remove grouping to enable dashboard"
                : "Show on dashboard"
            }
          />
          <span className="font-public-sans text-xs text-on-surface">
            Show in dashboard
          </span>
        </label>
      </div>

      {error ? (
        <p className="font-public-sans text-xs text-status-error">{error}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={onCancel} type="button" variant="darkFilled">
          Cancel
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={() => void handleSubmit()}
          type="button"
          variant="primaryFilled"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEditing ? (
            "Save"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}
