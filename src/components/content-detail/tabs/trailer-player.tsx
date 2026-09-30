"use client";

import { Film, Play } from "lucide-react";

type TrailerPlayerProps = {
  trailer?: {
    key: string;
    name: string;
    site: string;
  } | null;
  movieTitle?: string | null;
};

export function TrailerPlayer({ trailer, movieTitle }: TrailerPlayerProps) {
  if (!trailer?.key) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container/60 p-6 text-center">
        <Film className="h-8 w-8 text-outline-muted mb-2" />
        <p className="text-xs sm:text-sm text-secondary">
          No official trailer available for {movieTitle || "this movie"}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container/60 p-3 sm:p-5 backdrop-blur-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600 text-white">
            <Play className="h-3.5 w-3.5 fill-current" />
          </div>
          <h3 className="font-heading text-sm sm:text-base font-bold text-on-surface">
            {trailer.name || "Official Trailer"}
          </h3>
        </div>

        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
          YouTube
        </span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-outline-variant bg-black shadow-md">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          src={`https://www.youtube-nocookie.com/embed/${trailer.key}?rel=0`}
          title={trailer.name || "Movie Trailer"}
        />
      </div>
    </div>
  );
}

export default TrailerPlayer;
