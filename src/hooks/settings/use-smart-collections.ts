"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type {
  CollectionFilterItem,
  CollectionSortItem,
  SmartCollectionWithFilters,
} from "@/lib/types";
import { useAppDispatch } from "@/store";
import { showToast } from "@/store/slices/toastSlice";

export function useSmartCollections() {
  const dispatch = useAppDispatch();
  const [collections, setCollections] = useState<SmartCollectionWithFilters[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  const notify = useCallback(
    (message: string, variant: "success" | "error") => {
      dispatch(showToast({ message, variant }));
    },
    [dispatch],
  );

  const loadCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections ?? data.data?.collections ?? []);
      } else {
        notify("Failed to load smart collections.", "error");
      }
    } catch {
      notify("Failed to load smart collections.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    let ignore = false;

    void (async () => {
      try {
        const res = await fetch("/api/collections");
        if (ignore) return;
        if (res.ok) {
          const data = await res.json();
          setCollections(data.collections ?? data.data?.collections ?? []);
        } else {
          notify("Failed to load smart collections.", "error");
        }
      } catch {
        if (!ignore) {
          notify("Failed to load smart collections.", "error");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [notify]);

  async function saveCollection(payload: {
    name: string;
    mediaType: number;
    showInLibrary: boolean;
    showInDashboard: boolean;
    groupBy: number | null;
    filters: CollectionFilterItem[];
    sorts: CollectionSortItem[];
    editingId?: number;
  }) {
    const body = {
      name: payload.name,
      mediaType: payload.mediaType,
      showInLibrary: payload.showInLibrary,
      showInDashboard: payload.showInDashboard,
      groupBy: payload.groupBy,
      filters: payload.filters,
      sorts: payload.sorts,
    };

    if (payload.editingId) {
      const res = await apiFetch(`/api/collections/${payload.editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Failed to update collection.", "error");
        return false;
      }
      const updated = data.collection ?? data.data?.collection;
      if (updated) {
        setCollections((prev) =>
          prev.map((item) => (item.id === payload.editingId ? updated : item)),
        );
      }
      notify("Collection updated successfully.", "success");
      return true;
    }

    const res = await apiFetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Failed to create collection.", "error");
      return false;
    }
    await loadCollections();
    notify("Collection created successfully.", "success");
    return true;
  }

  async function deleteCollection(id: number) {
    try {
      const res = await apiFetch(`/api/collections/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Failed to delete collection.", "error");
        return false;
      }
      setCollections(data.collections ?? data.data?.collections ?? []);
      notify("Collection deleted.", "success");
      return true;
    } catch {
      notify("Failed to delete collection.", "error");
      return false;
    }
  }

  async function reorderCollections(orderedIds: number[]) {
    setCollections((prev) => {
      const map = new Map(prev.map((col) => [col.id, col]));
      return orderedIds
        .map((id, index) => {
          const col = map.get(id);
          return col ? { ...col, displayOrder: index } : null;
        })
        .filter((col): col is SmartCollectionWithFilters => col !== null);
    });

    try {
      const res = await apiFetch("/api/collections/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        notify(data.error || "Failed to reorder collections.", "error");
        await loadCollections();
        return false;
      }
      return true;
    } catch {
      notify("Failed to reorder collections.", "error");
      await loadCollections();
      return false;
    }
  }

  async function patchCollection(
    id: number,
    patch: Partial<{
      showInLibrary: boolean;
      showInDashboard: boolean;
      groupBy: number | null;
    }>,
  ) {
    try {
      const res = await apiFetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notify(data.error || "Failed to update collection.", "error");
        return false;
      }
      const data = await res.json();
      const updated = data.collection ?? data.data?.collection;
      if (updated) {
        setCollections((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
      }
      return true;
    } catch {
      notify("Failed to update collection.", "error");
      return false;
    }
  }

  return {
    collections,
    isLoading,
    loadCollections,
    saveCollection,
    deleteCollection,
    reorderCollections,
    patchCollection,
  };
}
