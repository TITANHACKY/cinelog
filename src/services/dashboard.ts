import { getCollectionLibraryItems, getUserCollections } from "@/services/collections";
import { getLibrary } from "@/services/library";
import type {
  CustomCollectionWithFilters,
  LibraryMetadata,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";

export type DashboardCollection = CustomCollectionWithFilters & {
  preview: {
    movies: LibraryMovie[];
    series: LibrarySeries[];
    metadata: LibraryMetadata;
  };
};

export type DashboardData = {
  counts: {
    movies: number;
    series: number;
  };
  collections: DashboardCollection[];
};

export async function getDashboardData(userId: number): Promise<DashboardData> {
  const [movieCountResult, seriesCountResult, allCollections] = await Promise.all([
    getLibrary(userId, {
      type: "movie",
      offset: 0,
      limit: 1,
      sort_field: "created_at",
      sort_direction: 1,
    }),
    getLibrary(userId, {
      type: "series",
      offset: 0,
      limit: 1,
      sort_field: "created_at",
      sort_direction: 1,
    }),
    getUserCollections(userId),
  ]);

  const dashboardCollections = allCollections
    .filter((col) => col.showInDashboard && col.groupBy === null)
    .sort((left, right) => left.displayOrder - right.displayOrder);

  const previews = await Promise.all(
    dashboardCollections.map(async (collection) => {
      const preview = await getCollectionLibraryItems(collection.id, userId, {
        offset: 0,
        limit: 15,
      });
      return {
        ...collection,
        preview: {
          movies: preview.movies,
          series: preview.series,
          metadata: preview.metadata,
        },
      };
    }),
  );

  return {
    counts: {
      movies: movieCountResult.metadata.count.movies,
      series: seriesCountResult.metadata.count.series,
    },
    collections: previews,
  };
}
