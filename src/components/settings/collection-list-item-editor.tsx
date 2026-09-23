"use client";

import { FilterClauseRow } from "@/components/settings/filter-clause-row";
import { SearchFilterSelect } from "@/components/search-popup/search-filter-select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Tooltip } from "@/components/ui/tooltip";
import {
  LIBRARY_GROUP_OPTIONS,
  LIBRARY_SORT_OPTIONS,
  MAX_COLLECTION_FILTERS,
} from "@/lib/constants";
import { defaultFilterValue } from "@/lib/media/library-browse";
import type {
  CollectionFilterItem,
  CollectionSortItem,
  LibraryMediaType,
  SmartCollectionWithFilters,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Info, Loader2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CollectionListItemEditorProps = {
  collection?: SmartCollectionWithFilters;
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

const defaultFilter = (mediaType: LibraryMediaType): CollectionFilterItem => ({
  field: "genre",
  operator: 0,
  value: defaultFilterValue("genre", mediaType),
});

const MEDIA_TYPE_OPTIONS = [
  { value: "0", label: "Movies" },
  { value: "1", label: "Series" },
];

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
  const [filters, setFilters] = useState<CollectionFilterItem[]>(
    collection?.filters ?? [],
  );
  const [sort, setSort] = useState<CollectionSortItem>(
    collection?.sorts?.[0] ?? defaultSort(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupTooltipOpen, setGroupTooltipOpen] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function triggerGroupTooltip(duration = 5000) {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setGroupTooltipOpen(true);
    tooltipTimeoutRef.current = setTimeout(() => {
      setGroupTooltipOpen(false);
      tooltipTimeoutRef.current = null;
    }, duration);
  }

  function handleGroupTooltipChange(open: boolean) {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setGroupTooltipOpen(open);
  }

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const mediaTypeKey: LibraryMediaType = mediaType === 0 ? "movie" : "series";
  const sortOptions = LIBRARY_SORT_OPTIONS.filter(
    (option) => !option.seriesOnly || mediaTypeKey === "series",
  );
  const groupDisabled = showInDashboard;
  const dashboardDisabled = groupBy !== null;
  const canAddFilter = filters.length < MAX_COLLECTION_FILTERS;

  function updateFilter(
    index: number,
    field: keyof CollectionFilterItem,
    value: string | number,
  ) {
    setFilters((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addFilter() {
    if (!canAddFilter) return;
    setFilters((prev) => [...prev, defaultFilter(mediaTypeKey)]);
  }

  function removeFilter(index: number) {
    setFilters((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Collection name is required.");
      return;
    }

    const invalidFilter = filters.find((filter) => !filter.value.trim());
    if (invalidFilter) {
      setError("Each filter must have a value.");
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
      filters,
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
          <SearchFilterSelect
            aria-label="Media type"
            heading="Media type"
            menuMinWidth={220}
            onChange={(value) => {
              const next = Number(value);
              setMediaType(next);
              setFilters([]);
            }}
            options={MEDIA_TYPE_OPTIONS}
            placeholder="Media type"
            triggerClassName="min-w-full"
            value={String(mediaType)}
          />
        </FormField>
      </div>

      <FormField
        id="collection-filters"
        label="Filters"
        labelSuffix={
          <span className="rounded border border-outline-alt/60 bg-surface-container px-1.5 py-0.5 font-mono text-[11px] font-medium text-secondary">
            {filters.length}/{MAX_COLLECTION_FILTERS}
          </span>
        }
      >
        <div className="space-y-2">
          {filters.length === 0 ? (
            <p className="font-public-sans text-xs text-secondary">
              No filters — all items of this media type are included.
            </p>
          ) : (
            filters.map((filter, index) => (
              <div className="space-y-2" key={index}>
                {index > 0 ? (
                  <span className="inline-block font-mono text-[10px] font-bold tracking-wider text-outline-muted uppercase">
                    AND
                  </span>
                ) : null}
                <FilterClauseRow
                  clause={filter}
                  mediaType={mediaTypeKey}
                  onRemove={() => removeFilter(index)}
                  onUpdate={(field, value) => updateFilter(index, field, value)}
                />
              </div>
            ))
          )}
          {canAddFilter ? (
            <Button
              className="h-8 gap-1.5 px-2.5 text-xs"
              onClick={addFilter}
              type="button"
              variant="darkFilled"
            >
              <Plus className="h-3.5 w-3.5" />
              Add filter
            </Button>
          ) : null}
        </div>
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
        <FormField
          id="collection-group"
          label="Group"
          labelSuffix={
            <Tooltip
              align="responsive"
              content="Collections displayed on the dashboard cannot be grouped. Disable 'Show in dashboard' to enable grouping."
              contentClassName="w-64 sm:w-72"
              isOpen={groupTooltipOpen}
              onOpenChange={handleGroupTooltipChange}
              side="top"
            >
              <button
                aria-label="Grouping restriction info"
                className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
                onClick={(event) => {
                  event.preventDefault();
                  handleGroupTooltipChange(!groupTooltipOpen);
                }}
                type="button"
              >
                <Info className="size-3.5" />
              </button>
            </Tooltip>
          }
        >
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
        <div
          className={cn(
            "flex items-center gap-2.5",
            dashboardDisabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
          onClick={() => {
            if (dashboardDisabled) {
              triggerGroupTooltip();
            }
          }}
        >
          <ToggleSwitch
            checked={showInDashboard}
            disabled={dashboardDisabled}
            onChange={() =>
              setShowInDashboard((prev) => {
                const next = !prev;
                if (next) {
                  setGroupBy(null);
                  triggerGroupTooltip();
                }
                return next;
              })
            }
            title={
              dashboardDisabled
                ? "Remove grouping to enable dashboard"
                : "Show on dashboard"
            }
          />
          <span
            className="font-public-sans text-xs text-on-surface select-none"
            onClick={() => {
              if (!dashboardDisabled) {
                setShowInDashboard((prev) => {
                  const next = !prev;
                  if (next) {
                    setGroupBy(null);
                    triggerGroupTooltip();
                  }
                  return next;
                });
              }
            }}
          >
            Show in dashboard
          </span>
        </div>
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
