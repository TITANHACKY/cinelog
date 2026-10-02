import type { MovieDetails, SeriesDetails } from "@/lib/types";
import { orFallback } from "@/lib/utils";

type MetaRowInput = {
  movie?: MovieDetails | null;
  series?: SeriesDetails | null;
  type?: "movie" | "series";
};

type MetaRowData = {
  contentType: string;
  duration: string;
  rating: string;
  status: string;
  year: string;
};

export function useMetaRow({ movie, series, type }: MetaRowInput): MetaRowData {
  const firstAirYear = orFallback(series?.first_air_date?.slice(0, 4));
  const lastAirYear = orFallback(series?.last_air_date?.slice(0, 4), "Present");
  const year = movie
    ? orFallback(movie.release_date?.slice(0, 4))
    : firstAirYear === lastAirYear
      ? lastAirYear
      : `${firstAirYear} - ${lastAirYear}`;
  const seasonCount = series?.number_of_seasons ?? 1;
  const episodeCount = series?.number_of_episodes ?? 10;
  const movieRating = movie?.certification?.certification;

  return {
    contentType: type === "series" ? "Series" : "Movie",
    duration: movie
      ? movie.runtime
        ? `${movie.runtime} min`
        : "N/A"
      : `${seasonCount} ${seasonCount === 1 ? "Season" : "Seasons"} (${episodeCount} ${episodeCount === 1 ? "Episode" : "Episodes"})`,
    rating: orFallback(movieRating || series?.certification?.certification),
    status: orFallback(movie?.status || series?.status),
    year,
  };
}
