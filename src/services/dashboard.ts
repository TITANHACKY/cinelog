import {
  getCollectionLibraryItems,
  getUserCollections,
} from "@/services/collections";
import { getLibrary } from "@/services/library";
import type {
  LibraryMetadata,
  LibraryMovie,
  LibrarySeries,
  SmartCollectionWithFilters,
} from "@/lib/types";

export type DashboardCollection = SmartCollectionWithFilters & {
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
  const allCollections = await getUserCollections(userId);

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

  const libraryTotals = await getLibrary(userId, {
    type: "movie",
    offset: 0,
    limit: 1, // limit: 1 ensures it returns quickly while fetching the counts
    sort_field: "created_at",
    sort_direction: 1,
  });

  const counts = libraryTotals.metadata.count;
  return {
    counts,
    collections: previews,
  };
}
