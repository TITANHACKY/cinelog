"use client";

import { useCallback } from "react";
import type {
  CollectionFilterItem,
  CollectionSortItem,
  SmartCollectionWithFilters,
} from "@/lib/types";
import { apiErrorMessage } from "@/store/api/base-api";
import {
  collectionsApi,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useGetCollectionsQuery,
  useReorderCollectionsMutation,
  useUpdateCollectionMutation,
} from "@/store/api/collections-api";
import { clearLibraryBrowseSession } from "@/lib/media/library-browse-session";
import { useUpdateProfileMutation } from "@/store/api/user-api";
import { useAppDispatch, useAppSelector } from "@/store";
import { libraryBrowseReset } from "@/store/slices/librarySlice";
import { showToast } from "@/store/slices/toastSlice";

export function useSmartCollections() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const smartCollectionsEnabled = Boolean(user?.smartCollectionsEnabled);

  const result = useGetCollectionsQuery();
  const [createCollection] = useCreateCollectionMutation();
  const [updateCollection] = useUpdateCollectionMutation();
  const [removeCollection] = useDeleteCollectionMutation();
  const [reorder] = useReorderCollectionsMutation();
  const [updateProfile, { isLoading: isToggling }] = useUpdateProfileMutation();
  const collections = result.data?.collections ?? [];

  const notify = useCallback(
    (message: string, variant: "success" | "error") => {
      dispatch(showToast({ message, variant }));
    },
    [dispatch],
  );

  const loadCollections = useCallback(async () => {
    try {
      await result.refetch().unwrap();
    } catch (error) {
      notify(
        apiErrorMessage(error, "Failed to load smart collections."),
        "error",
      );
    }
  }, [notify, result]);

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

    try {
      if (payload.editingId) {
        await updateCollection({ id: payload.editingId, body }).unwrap();
        notify("Collection updated successfully.", "success");
        return true;
      }
      await createCollection(body).unwrap();
      notify("Collection created successfully.", "success");
      return true;
    } catch (error) {
      notify(
        apiErrorMessage(
          error,
          payload.editingId
            ? "Failed to update collection."
            : "Failed to create collection.",
        ),
        "error",
      );
      return false;
    }
  }

  async function deleteCollection(id: number) {
    try {
      await removeCollection(id).unwrap();
      notify("Collection deleted.", "success");
      return true;
    } catch (error) {
      notify(apiErrorMessage(error, "Failed to delete collection."), "error");
      return false;
    }
  }

  async function reorderCollections(orderedIds: number[]) {
    const patch = dispatch(
      collectionsApi.util.updateQueryData(
        "getCollections",
        undefined,
        (draft) => {
          const map = new Map(draft.collections.map((col) => [col.id, col]));
          draft.collections = orderedIds.flatMap((id, index) => {
            const col = map.get(id);
            return col ? [{ ...col, displayOrder: index }] : [];
          });
        },
      ),
    );

    try {
      await reorder({ orderedIds }).unwrap();
      return true;
    } catch (error) {
      patch.undo();
      notify(apiErrorMessage(error, "Failed to reorder collections."), "error");
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
      await updateCollection({ id, body: patch }).unwrap();
      return true;
    } catch (error) {
      notify(apiErrorMessage(error, "Failed to update collection."), "error");
      return false;
    }
  }

  const toggleSmartCollections = useCallback(
    async (enabled: boolean) => {
      try {
        await updateProfile({ smartCollectionsEnabled: enabled }).unwrap();
        clearLibraryBrowseSession();
        dispatch(libraryBrowseReset());
        notify(
          enabled
            ? "Smart collections enabled."
            : "Smart collections disabled.",
          "success",
        );
      } catch (error) {
        notify(
          apiErrorMessage(error, "Failed to update smart collections setting."),
          "error",
        );
      }
    },
    [dispatch, notify, updateProfile],
  );

  return {
    collections,
    isLoading: result.isLoading,
    isToggling,
    smartCollectionsEnabled,
    toggleSmartCollections,
    loadCollections,
    saveCollection,
    deleteCollection,
    reorderCollections,
    patchCollection,
  };
}

export type { SmartCollectionWithFilters };
