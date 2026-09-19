"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { CollectionListItem } from "@/components/settings/collection-list-item";
import { CollectionListItemEditor } from "@/components/settings/collection-list-item-editor";
import { useCustomCollections } from "@/hooks/settings/use-custom-collections";
import { Layers, Plus } from "lucide-react";
import { useState } from "react";

export function CustomCollectionsSection() {
  const {
    collections,
    isLoading,
    saveCollection,
    deleteCollection,
    reorderCollections,
    patchCollection,
  } = useCustomCollections();

  const [expandedId, setExpandedId] = useState<number | "create" | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const activeCount = collections.filter(
    (item) => item.showInLibrary || item.showInDashboard,
  ).length;

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }

    const next = [...collections];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    void reorderCollections(next.map((col) => col.id));
  }

  return (
    <section
      aria-labelledby="custom-collections-heading"
      className="relative w-full space-y-6"
    >
      <div
        aria-hidden={isLoading}
        className={`space-y-6 ${isLoading ? "blur-sm" : ""}`}
      >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2
              className="font-heading text-xl font-semibold tracking-tight text-on-surface sm:text-2xl"
              id="custom-collections-heading"
            >
              Custom Collections
            </h2>
            <span className="inline-flex items-center rounded-md border border-brand-tertiary-accent/30 bg-brand-tertiary-accent/10 px-2.5 py-0.5 font-public-sans text-xs font-semibold text-brand-tertiary-accent">
              {activeCount} Active
            </span>
          </div>
          <p className="mt-1 font-public-sans text-xs text-secondary">
            Drag to reorder. Each collection supports one filter, sort, and
            optional group.
          </p>
        </div>
        <Button
          className="inline-flex h-9 items-center gap-2 rounded-lg px-4 font-public-sans text-xs font-semibold"
          onClick={() =>
            setExpandedId((prev) => (prev === "create" ? null : "create"))
          }
          type="button"
          variant="primaryFilled"
        >
          <Plus className="h-4 w-4" />
          Add Collection
        </Button>
      </div>

      {expandedId === "create" ? (
        <div className="rounded-xl border border-outline-alt/60 bg-surface-container-low p-4">
          <CollectionListItemEditor
            onCancel={() => setExpandedId(null)}
            onSave={async (payload) => {
              const saved = await saveCollection(payload);
              if (saved) setExpandedId(null);
              return saved;
            }}
          />
        </div>
      ) : null}

      {!isLoading && collections.length === 0 ? (
        <EmptyState
          description="Create a collection with a filter, sort, and optional group to use as a library preset or dashboard carousel."
          icon={<Layers className="h-6 w-6" />}
          title="No collections configured"
        />
      ) : !isLoading ? (
        <ul className="space-y-2">
          {collections.map((collection, index) => (
            <CollectionListItem
              collection={collection}
              index={index}
              isDragging={dragIndex === index}
              isExpanded={expandedId === collection.id}
              key={collection.id}
              onDelete={() => void deleteCollection(collection.id)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => handleDragStart(index)}
              onDrop={() => handleDrop(index)}
              onSave={async (payload) => {
                const saved = await saveCollection(payload);
                if (saved) setExpandedId(null);
                return saved;
              }}
              onToggleDashboard={() =>
                void patchCollection(collection.id, {
                  showInDashboard: !collection.showInDashboard,
                  groupBy: !collection.showInDashboard
                    ? null
                    : collection.groupBy,
                })
              }
              onToggleExpand={() =>
                setExpandedId((prev) =>
                  prev === collection.id ? null : collection.id,
                )
              }
              onToggleLibrary={() =>
                void patchCollection(collection.id, {
                  showInLibrary: !collection.showInLibrary,
                })
              }
            />
          ))}
        </ul>
      ) : null}
      </div>
      {isLoading ? <LoadingOverlay /> : null}
    </section>
  );
}
