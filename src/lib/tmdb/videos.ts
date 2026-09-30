type TmdbVideo = {
  site?: string;
  type?: string;
  official?: boolean;
  key?: string;
  name?: string;
};

type TmdbVideosPayload = {
  results?: TmdbVideo[];
};

export function extractTrailer(videos?: TmdbVideosPayload | null) {
  const results = videos?.results ?? [];
  const officialTrailer = results.find(
    (v) =>
      v.site === "YouTube" &&
      v.type === "Trailer" &&
      v.official === true &&
      Boolean(v.key),
  );
  const anyTrailer = results.find(
    (v) => v.site === "YouTube" && v.type === "Trailer" && Boolean(v.key),
  );
  const teaser = results.find(
    (v) => v.site === "YouTube" && v.type === "Teaser" && Boolean(v.key),
  );
  const chosen = officialTrailer ?? anyTrailer ?? teaser;
  if (!chosen?.key) return null;
  return {
    key: chosen.key,
    name: chosen.name || "Official Trailer",
    site: chosen.site || "YouTube",
  };
}
