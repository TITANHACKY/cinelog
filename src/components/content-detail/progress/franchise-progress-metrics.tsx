type FranchiseProgressMetricsProps = {
  watchedCount: number;
  totalCount: number;
  percentage: number;
  label?: string;
};

export function FranchiseProgressMetrics({
  watchedCount,
  totalCount,
  percentage,
  label = "Franchise Progress",
}: FranchiseProgressMetricsProps) {
  if (totalCount <= 0) {
    return null;
  }

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex items-center justify-between gap-3 text-sm text-on-surface">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">
          {watchedCount}/{totalCount} ({percentage}%)
        </span>
      </div>

      <div
        aria-label={`${label}: ${watchedCount} of ${totalCount} movies, ${percentage} percent`}
        aria-valuemax={totalCount}
        aria-valuemin={0}
        aria-valuenow={watchedCount}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default FranchiseProgressMetrics;
