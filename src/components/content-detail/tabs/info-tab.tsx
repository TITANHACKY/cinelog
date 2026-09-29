"use client";

import { WhereToWatch } from "@/components/content-detail/tabs/where-to-watch";
import { TrailerPlayer } from "@/components/content-detail/tabs/trailer-player";
import type { MovieDetails } from "@/lib/types";

type InfoTabProps = {
  movie: MovieDetails;
};

export function InfoTab({ movie }: InfoTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
      {/* Where to Stream */}
      <WhereToWatch
        availableCountries={movie.available_countries}
        imdbId={movie.imdb_id}
        tmdbId={movie.id}
        watchProviders={movie.watch_providers}
      />

      {/* Official YouTube Trailer */}
      <TrailerPlayer movieTitle={movie.title} trailer={movie.trailer} />
    </div>
  );
}

export default InfoTab;
