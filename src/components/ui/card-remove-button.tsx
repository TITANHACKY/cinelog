"use client";

import { BookmarkOff, BookmarkPlus, Loader2 } from "lucide-react";
import { TRIGGER_CLASS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CardRemoveButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  isInLibrary?: boolean;
  onClick: () => void;
};

export function CardRemoveButton({
  disabled = false,
  loading = false,
  isInLibrary = true,
  onClick,
}: CardRemoveButtonProps) {
  const label = isInLibrary ? "Remove from library" : "Add to library";

  return (
    <button
      aria-label={label}
      className={cn(
        TRIGGER_CLASS,
        "shrink-0",
        isInLibrary ? "text-secondary" : "text-brand-primary",
      )}
      disabled={disabled || loading}
      onClick={onClick}
      title={label}
      type="button"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
      ) : isInLibrary ? (
        <BookmarkOff className="h-4 w-4" />
      ) : (
        <BookmarkPlus className="h-4 w-4" />
      )}
    </button>
  );
}
