"use client";

import { useState } from "react";
import Image from "next/image";
import { Film, Layers, Loader2, Trash2, type LucideIcon } from "lucide-react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppDispatch } from "@/store";
import {
  useUnfollowFranchiseMutation,
  type FollowedFranchiseItem,
} from "@/store/api/franchises-api";
import { showToast } from "@/store/slices/toastSlice";
import { TRIGGER_CLASS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type FranchiseCardProps = {
  franchise: FollowedFranchiseItem;
  onSelect?: () => void;
  onRemove?: () => void | Promise<void>;
  showRemoveButton?: boolean;
  className?: string;
  viewAllLabel?: string;
  viewAllIcon?: LucideIcon;
  buttonVariant?: ButtonVariant;
};

export function FranchiseCard({
  franchise,
  onSelect,
  onRemove,
  showRemoveButton = true,
  className,
  viewAllLabel = "View all movies",
  viewAllIcon: ViewAllIcon = Film,
  buttonVariant = "darkTonal",
}: FranchiseCardProps) {
  const dispatch = useAppDispatch();
  const [unfollowFranchise, { isLoading: isMutationLoading }] =
    useUnfollowFranchiseMutation();
  const [isRemovingLocal, setIsRemovingLocal] = useState(false);

  const isRemoving = isMutationLoading || isRemovingLocal;

  const imagePath = franchise.backdrop_path || franchise.poster_path;

  async function handleUnfollow(e: React.MouseEvent) {
    e.stopPropagation();
    if (isRemoving) return;

    if (onRemove) {
      try {
        setIsRemovingLocal(true);
        await onRemove();
      } finally {
        setIsRemovingLocal(false);
      }
      return;
    }

    try {
      await unfollowFranchise({ id: franchise.id }).unwrap();
      dispatch(
        showToast({
          message: `Unfollowed ${franchise.name}`,
          variant: "info",
        }),
      );
    } catch {
      dispatch(
        showToast({
          message: "Failed to unfollow franchise",
          variant: "error",
        }),
      );
    }
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container/70 transition hover:border-outline hover:bg-surface-container cursor-pointer",
        className,
      )}
      onClick={onSelect}
    >
      <div className="relative aspect-16/9 w-full overflow-hidden bg-surface-container-high">
        {imagePath ? (
          <Image
            alt={franchise.name}
            className="object-cover transition duration-300 group-hover:scale-105 opacity-80"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={`https://image.tmdb.org/t/p/w780${imagePath}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container-high">
            <Layers className="h-10 w-10 text-outline-muted/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-surface via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
            Franchise
          </span>
          <h2 className="font-heading text-base font-bold text-on-surface group-hover:text-brand-primary transition">
            {franchise.name}
          </h2>
          {franchise.overview && (
            <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant leading-relaxed">
              {franchise.overview}
            </p>
          )}
          {franchise.progress.total_count > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-xs font-semibold tabular-nums text-on-surface-variant">
                {franchise.progress.watched_count}/
                {franchise.progress.total_count} watched (
                {franchise.progress.percentage}%)
              </p>
              <Progress
                aria-label={`${franchise.name} progress: ${franchise.progress.watched_count} of ${franchise.progress.total_count} movies watched`}
                className="h-1.5"
                inProgressColor="bg-brand-primary"
                max={franchise.progress.total_count}
                value={franchise.progress.watched_count}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-outline-variant/60 pt-3">
          <Button
            className="h-8 flex-1 justify-center gap-1.5 rounded-[6px] border border-current/30 px-2.5 text-xs font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            type="button"
            variant={buttonVariant}
          >
            <ViewAllIcon className="size-3.5 shrink-0" />
            <span>{viewAllLabel}</span>
          </Button>

          {showRemoveButton && (
            <button
              aria-label={`Unfollow ${franchise.name}`}
              className={cn(
                TRIGGER_CLASS,
                "shrink-0 border-status-error/40 bg-status-error/10 text-status-error transition-colors hover:border-status-error/60 hover:bg-status-error/20",
              )}
              disabled={isRemoving}
              onClick={handleUnfollow}
              title="Unfollow franchise"
              type="button"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin text-status-error" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const FranchiseLibraryCard = FranchiseCard;
export default FranchiseCard;
