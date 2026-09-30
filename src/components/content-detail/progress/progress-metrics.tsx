import { useProgressMetrics } from "@/hooks/title-details/use-progress-metrics";
import type { SeriesDetails } from "@/lib/types";

type ProgressMetricsProps = {
  series?: SeriesDetails | null;
  selectedSeason?: number;
};

export function ProgressMetrics({
  series,
  selectedSeason,
}: ProgressMetricsProps) {
  const metrics = useProgressMetrics(series, selectedSeason);

  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
      {metrics.map((metric) => (
        <ProgressRow
          key={metric.id}
          label={metric.label}
          value={metric.value}
          total={metric.total}
          colorClass={metric.colorClass}
        />
      ))}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  colorClass,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex items-center justify-between gap-3 text-sm text-on-surface">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">
          {value}/{total} ({percent}%)
        </span>
      </div>

      <div
        aria-label={`${label}: ${value} of ${total} episodes, ${percent} percent`}
        aria-valuemax={total}
        aria-valuemin={0}
        aria-valuenow={value}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high"
        role="progressbar"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressMetrics;
