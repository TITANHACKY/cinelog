import { ERA_BUCKETS } from "@/lib/constants";

// Collapse the selected era buckets into one inclusive [gteYear, lteYear]
// window. TMDB's discover date filters can't express disjoint ranges, so we
// take the outer bounds of everything the user picked. A `null` bound means
// "open-ended" (pre-1980 has no lower bound, 2020s has no upper bound).
export function eraWindow(eras: string[]): {
  gteYear: number | null;
  lteYear: number | null;
} {
  const buckets = ERA_BUCKETS.filter((bucket) => eras.includes(bucket.value));
  if (buckets.length === 0) return { gteYear: null, lteYear: null };

  let gteYear: number | null = Infinity;
  let lteYear: number | null = -Infinity;
  for (const bucket of buckets) {
    // A null lower/upper bound opens that side entirely.
    gteYear =
      bucket.gteYear === null || gteYear === null
        ? null
        : Math.min(gteYear, bucket.gteYear);
    lteYear =
      bucket.lteYear === null || lteYear === null
        ? null
        : Math.max(lteYear, bucket.lteYear);
  }
  return {
    gteYear: gteYear === Infinity ? null : gteYear,
    lteYear: lteYear === -Infinity ? null : lteYear,
  };
}
