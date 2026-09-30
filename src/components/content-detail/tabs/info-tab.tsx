"use client";

import { WhereToWatch } from "@/components/content-detail/tabs/where-to-watch";
import { TrailerPlayer } from "@/components/content-detail/tabs/trailer-player";
import type { MovieDetails, SeriesDetails } from "@/lib/types";

type InfoTabProps = {
  movie?: MovieDetails;
  series?: SeriesDetails;
};

export function InfoTab({ movie, series }: InfoTabProps) {
  const media = movie ?? series;
  if (!media) return null;

  const isMovie = Boolean(movie);
  const title = movie?.title ?? series?.name;
  const mediaType = isMovie ? "movie" : "series";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
      <WhereToWatch
        availableCountries={media.available_countries}
        imdbId={media.imdb_id}
        mediaType={mediaType}
        tmdbId={media.id}
        watchProviders={media.watch_providers}
      />

      <TrailerPlayer title={title} trailer={media.trailer} />
    </div>
  );
}

export default InfoTab;
