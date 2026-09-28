"use client";

import { useEffect, useRef, useState } from "react";
import { LIBRARY_SORT_OPTIONS, MAX_COLLECTION_FILTERS } from "@/lib/constants";
import { defaultFilterValue } from "@/lib/media/library-browse";
import type {
  CollectionFilterItem,
  CollectionSortItem,
  LibraryMediaType,
  SmartCollectionWithFilters,
} from "@/lib/types";

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

type SavePayload = {
  name: string;
  mediaType: number;
  showInLibrary: boolean;
  showInDashboard: boolean;
  groupBy: number | null;
  filters: CollectionFilterItem[];
  sorts: CollectionSortItem[];
  editingId?: number;
};

export function useCollectionEditor(
  collection: SmartCollectionWithFilters | undefined,
  onCancel: () => void,
  onSave: (payload: SavePayload) => Promise<boolean>,
) {
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
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
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
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
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

  function changeMediaType(value: string) {
    setMediaType(Number(value));
    setFilters([]);
  }

  function changeSort(value: string) {
    const [field, direction] = value.split(":");
    setSort({ field, direction: Number(direction), priority: 0 });
  }

  function toggleShowInDashboard() {
    setShowInDashboard((prev) => {
      const next = !prev;
      if (next) {
        setGroupBy(null);
        triggerGroupTooltip();
      }
      return next;
    });
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
    if (saved) onCancel();
  }

  return {
    isEditing,
    name,
    setName,
    mediaType,
    showInLibrary,
    setShowInLibrary,
    showInDashboard,
    groupBy,
    setGroupBy,
    filters,
    sort,
    isSubmitting,
    error,
    groupTooltipOpen,
    triggerGroupTooltip,
    handleGroupTooltipChange,
    mediaTypeKey,
    sortOptions,
    groupDisabled,
    dashboardDisabled,
    canAddFilter,
    updateFilter,
    addFilter,
    removeFilter,
    changeMediaType,
    changeSort,
    toggleShowInDashboard,
    handleSubmit,
  };
}
