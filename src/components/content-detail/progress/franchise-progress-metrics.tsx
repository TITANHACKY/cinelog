import { Progress } from "@/components/ui/progress";

type FranchiseProgressMetricsProps = {
  watchedCount: number;
  totalCount: number;
  percentage: number;
  label?: string;
  inProgressColor?: string;
};

export function FranchiseProgressMetrics({
  watchedCount,
  totalCount,
  percentage,
  label = "Franchise Progress",
  inProgressColor = "bg-brand-primary",
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

      <Progress
        aria-label={`${label}: ${watchedCount} of ${totalCount} movies, ${percentage} percent`}
        className="h-2.5"
        inProgressColor={inProgressColor}
        max={totalCount}
        value={watchedCount}
      />
    </div>
  );
}

export default FranchiseProgressMetrics;
