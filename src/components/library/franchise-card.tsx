"use client";

import { useState } from "react";
import Image from "next/image";
import { Film, Layers, Loader2, Trash2, type LucideIcon } from "lucide-react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { useAppDispatch } from "@/store";
import {
  useUnfollowFranchiseMutation,
  type FollowedFranchiseItem,
} from "@/store/api/franchises-api";
import { showToast } from "@/store/slices/toastSlice";
import { cn } from "@/lib/utils";

export type FranchiseCardData = {
  id?: number;
  tmdbId?: number;
  name: string;
  overview?: string | null;
  posterPath?: string | null;
  poster_path?: string | null;
  backdropPath?: string | null;
  backdrop_path?: string | null;
};

export type FranchiseCardProps = {
  franchise: FollowedFranchiseItem | FranchiseCardData;
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

  const franchiseId = franchise.tmdbId ?? franchise.id;
  const imagePath =
    franchise.backdropPath ||
    ("backdrop_path" in franchise ? franchise.backdrop_path : null) ||
    franchise.posterPath ||
    ("poster_path" in franchise ? franchise.poster_path : null);

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

    if (!franchiseId) return;

    try {
      await unfollowFranchise({ id: franchiseId }).unwrap();
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
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-outline-variant/60 pt-3">
          <Button
            className="h-8 flex-1 gap-1.5 text-xs font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            type="button"
            variant={buttonVariant}
          >
            <ViewAllIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{viewAllLabel}</span>
          </Button>

          {showRemoveButton && (
            <Button
              aria-label={`Unfollow ${franchise.name}`}
              className="h-8 w-8 shrink-0 rounded-lg text-secondary transition hover:border-status-error/40 hover:bg-status-error/10 hover:text-status-error"
              disabled={isRemoving}
              onClick={handleUnfollow}
              size="icon"
              title="Unfollow franchise"
              type="button"
              variant="darkFilled"
            >
              {isRemoving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const FranchiseLibraryCard = FranchiseCard;
export default FranchiseCard;
