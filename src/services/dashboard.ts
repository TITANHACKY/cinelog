import { getUserCollections } from "@/services/collections";
import { getLibrary } from "@/services/library";
import type {
  CustomCollectionWithFilters,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";

export type DashboardData = {
  counts: {
    movies: number;
    series: number;
  };
  continueWatching: {
    movies: LibraryMovie[];
    series: LibrarySeries[];
  };
  collections: CustomCollectionWithFilters[];
  library: {
    movies: LibraryMovie[];
    series: LibrarySeries[];
  };
};

export async function getDashboardData(userId: number): Promise<DashboardData> {
  const [movieLibrary, seriesLibrary, collections] = await Promise.all([
    getLibrary(userId, {
      type: "movie",
      offset: 0,
      limit: 5000,
      sort_field: "created_at",
      sort_direction: 1,
    }),
    getLibrary(userId, {
      type: "series",
      offset: 0,
      limit: 5000,
      sort_field: "created_at",
      sort_direction: 1,
    }),
    getUserCollections(userId),
  ]);

  const continueWatchingMovies = movieLibrary.movies.filter(
    (movie) => movie.watch_status === 1,
  );
  const continueWatchingSeries = seriesLibrary.series.filter(
    (show) => show.watch_status === 1,
  );

  return {
    counts: {
      movies: movieLibrary.metadata.count.movies,
      series: seriesLibrary.metadata.count.series,
    },
    continueWatching: {
      movies: continueWatchingMovies,
      series: continueWatchingSeries,
    },
    collections,
    library: {
      movies: movieLibrary.movies,
      series: seriesLibrary.series,
    },
  };
}
