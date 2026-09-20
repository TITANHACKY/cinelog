"use client";

import { CollectionListItemEditor } from "@/components/settings/collection-list-item-editor";
import { Button } from "@/components/ui/button";
import { FilterQueryChips } from "@/components/ui/filter-query-chips";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { LIBRARY_GROUP_OPTIONS } from "@/lib/constants";
import type { SmartCollectionWithFilters } from "@/lib/types";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { useState, type DragEvent } from "react";

type CollectionListItemProps = {
  collection: SmartCollectionWithFilters;
  index: number;
  isDragging: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDragStart: () => void;
  onDragOver: (event: DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
  onToggleLibrary: () => void;
  onToggleDashboard: () => void;
  onSave: Parameters<typeof CollectionListItemEditor>[0]["onSave"];
};

function groupLabel(groupBy: number | null) {
  if (groupBy === null) return null;
  return (
    LIBRARY_GROUP_OPTIONS.find((option) => option.value === String(groupBy))
      ?.label ?? `Group ${groupBy}`
  );
}

export function CollectionListItem({
  collection,
  index,
  isDragging,
  isExpanded,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
  onToggleLibrary,
  onToggleDashboard,
  onSave,
}: CollectionListItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const group = groupLabel(collection.groupBy);

  return (
    <li
      className={`rounded-xl border border-outline-alt/60 bg-surface-container-low transition-opacity ${
        isDragging ? "opacity-50" : ""
      }`}
      draggable
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            aria-label="Drag to reorder"
            className="mt-0.5 cursor-grab text-secondary/50 active:cursor-grabbing"
            draggable={false}
            type="button"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-outline-muted">
                #{String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-heading text-base font-semibold text-on-surface">
                {collection.name}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 font-public-sans text-[10px] font-semibold ${
                  collection.mediaType === 0
                    ? "border border-sky-500/30 bg-sky-500/10 text-sky-400"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}
              >
                {collection.mediaType === 0 ? "Movie" : "Series"}
              </span>
              {group ? (
                <span className="rounded-full border border-outline-alt px-2 py-0.5 font-public-sans text-[10px] text-secondary">
                  {group}
                </span>
              ) : null}
            </div>
            <FilterQueryChips filters={collection.filters} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pl-7 sm:pl-0">
          <ToggleSwitch
            checked={collection.showInLibrary}
            onChange={onToggleLibrary}
            title="Show in library"
          />
          <ToggleSwitch
            checked={collection.showInDashboard}
            disabled={collection.groupBy !== null}
            onChange={onToggleDashboard}
            title={
              collection.groupBy !== null
                ? "Remove grouping to show on dashboard"
                : "Show on dashboard"
            }
          />
          <Button
            aria-expanded={isExpanded}
            className="h-8 gap-1 px-2.5 text-xs"
            onClick={onToggleExpand}
            type="button"
            variant="darkFilled"
          >
            Edit
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                className="h-8 px-2 text-xs text-status-error"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete();
                }}
                type="button"
                variant="ghost"
              >
                Confirm
              </Button>
              <Button
                className="h-8 px-2 text-xs"
                onClick={() => setConfirmDelete(false)}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              aria-label="Delete collection"
              className="h-8 w-8 text-status-error border border-current/30 bg-current/10"
              onClick={() => setConfirmDelete(true)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {isExpanded ? (
        <div className="px-4 pb-4">
          <CollectionListItemEditor
            collection={collection}
            onCancel={onToggleExpand}
            onSave={onSave}
          />
        </div>
      ) : null}
    </li>
  );
}
