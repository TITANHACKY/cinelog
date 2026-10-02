import type { SeriesDetails } from "@/lib/types";

type ProgressMetric = {
  colorClass: string;
  id: string | number;
  label: string;
  total: number;
  value: number;
};

export function useProgressMetrics(
  series?: SeriesDetails | null,
  seasonNumber?: number,
): ProgressMetric[] {
  const seasons = series?.seasons ?? [];
  const metrics: ProgressMetric[] = [];

  const selectedSeason = seasons.find(
    (season, index) => (season.season_number ?? index + 1) === seasonNumber,
  );

  if (selectedSeason) {
    const seasonTotal =
      selectedSeason.episodes_aired ?? selectedSeason.episode_count ?? 0;

    metrics.push({
      colorClass: "bg-brand-tertiary-accent-alt",
      id: selectedSeason.id ?? seasonNumber ?? "",
      label: selectedSeason.name ?? `Season ${seasonNumber}`,
      total: seasonTotal,
      value: Math.min(selectedSeason.episodes_watched ?? 0, seasonTotal),
    });
  }

  if (series) {
    const overallTotal =
      series.total_episodes_aired ?? series.number_of_episodes ?? 0;

    metrics.push({
      colorClass: "bg-brand-primary",
      id: "overall",
      label: "Series Overall Progress",
      total: overallTotal,
      value: Math.min(
        series.total_number_of_episodes_watched ?? 0,
        overallTotal,
      ),
    });
  }

  return metrics;
}
