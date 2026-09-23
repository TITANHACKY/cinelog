export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function orFallback(value: string | null | undefined, fallback = "N/A") {
  return value?.trim() ? value : fallback;
}

export function formatRating(value: string | number) {
  const rating = typeof value === "number" ? value : Number(value);
  return Number.isFinite(rating) ? rating.toFixed(1) : value;
}
