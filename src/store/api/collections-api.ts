import type {
  CollectionFilterItem,
  CollectionSortItem,
  SmartCollectionWithFilters,
} from "@/lib/types";
import { baseApi, libraryTagIds } from "@/store/api/base-api";

export type CollectionWriteBody = {
  name: string;
  mediaType: number;
  showInLibrary: boolean;
  showInDashboard: boolean;
  groupBy: number | null;
  filters: CollectionFilterItem[];
  sorts: CollectionSortItem[];
};

const collectionTags = ["Collections", ...libraryTagIds] as const;

export const collectionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCollections: build.query<
      { collections: SmartCollectionWithFilters[] },
      void
    >({
      query: () => ({ url: "/api/collections" }),
      providesTags: ["Collections"],
    }),
    createCollection: build.mutation<
      { collection: SmartCollectionWithFilters },
      CollectionWriteBody
    >({
      query: (body) => ({ url: "/api/collections", method: "POST", body }),
      invalidatesTags: [...collectionTags],
    }),
    updateCollection: build.mutation<
      { collection: SmartCollectionWithFilters },
      { id: number; body: Partial<CollectionWriteBody> }
    >({
      query: ({ id, body }) => ({
        url: `/api/collections/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [...collectionTags],
    }),
    deleteCollection: build.mutation<
      { collections: SmartCollectionWithFilters[] },
      number
    >({
      query: (id) => ({ url: `/api/collections/${id}`, method: "DELETE" }),
      invalidatesTags: [...collectionTags],
    }),
    reorderCollections: build.mutation<
      { success?: boolean },
      { orderedIds: number[] }
    >({
      query: (body) => ({
        url: "/api/collections/reorder",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Collections", "Dashboard"],
    }),
  }),
});

export const {
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useReorderCollectionsMutation,
} = collectionsApi;
