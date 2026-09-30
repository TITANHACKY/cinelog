import { WATCH_STATUS } from "@/lib/constants";

const COMPLETED_WATCH_STATUS = WATCH_STATUS[2].value;

export type FranchiseProgress = {
  watchedCount: number;
  totalCount: number;
  percentage: number;
};

export function calculateFranchiseProgress(
  parts: Array<{ watch_status?: number | null }>,
): FranchiseProgress {
  const totalCount = parts.length;
  const watchedCount = parts.filter(
    (part) => part.watch_status === COMPLETED_WATCH_STATUS,
  ).length;

  const percentage =
    totalCount > 0
      ? Math.min(100, Math.round((watchedCount / totalCount) * 100))
      : 0;

  return { watchedCount, totalCount, percentage };
}

export function progressFromCounts(
  watchedCount: number,
  totalCount: number,
): FranchiseProgress {
  const percentage =
    totalCount > 0
      ? Math.min(100, Math.round((watchedCount / totalCount) * 100))
      : 0;

  return { watchedCount, totalCount, percentage };
}

export function toFranchiseProgressApi(progress: FranchiseProgress) {
  return {
    watched_count: progress.watchedCount,
    total_count: progress.totalCount,
    percentage: progress.percentage,
  };
}

export function toFranchiseProgressApiFromCounts(
  watchedCount: number,
  totalCount: number,
) {
  return toFranchiseProgressApi(progressFromCounts(watchedCount, totalCount));
}
