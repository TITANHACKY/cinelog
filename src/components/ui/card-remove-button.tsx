"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkOff, BookmarkPlus, Loader2 } from "lucide-react";
import { TRIGGER_CLASS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CardRemoveButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  isInLibrary?: boolean;
  className?: string;
  onClick: () => void;
};

export function CardRemoveButton({
  disabled = false,
  loading = false,
  isInLibrary = true,
  className,
  onClick,
}: CardRemoveButtonProps) {
  const [animKey, setAnimKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animType, setAnimType] = useState<"add" | "remove">("add");
  const prevInLibraryRef = useRef<boolean | undefined>(isInLibrary);

  // Trigger sparks and squash when isInLibrary prop transitions
  useEffect(() => {
    if (
      prevInLibraryRef.current !== undefined &&
      prevInLibraryRef.current !== isInLibrary
    ) {
      setAnimType(isInLibrary ? "add" : "remove");
      setAnimKey((k) => k + 1);
      setIsAnimating(true);
    }
    prevInLibraryRef.current = isInLibrary;
  }, [isInLibrary]);

  // Clear animation state after particle life cycle completes
  useEffect(() => {
    if (!isAnimating) return;
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isAnimating, animKey]);

  const handleClick = () => {
    if (!disabled && !loading) {
      setAnimType(isInLibrary ? "remove" : "add");
      setAnimKey((k) => k + 1);
      setIsAnimating(true);
    }
    onClick();
  };

  const label = isInLibrary ? "Remove from library" : "Add to library";

  return (
    <button
      aria-label={label}
      className={cn(
        TRIGGER_CLASS,
        "relative shrink-0 overflow-visible transition-all duration-200 active:scale-90",
        isInLibrary
          ? "text-secondary hover:text-on-surface"
          : "text-brand-primary",
        isAnimating && "anim-reaction-squash",
        className,
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      title={label}
      type="button"
    >
      {/* Live Floating Reaction Sparks */}
      {isAnimating && (
        <span
          key={`card-sparks-${animType}-${animKey}`}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center select-none"
        >
          {animType === "remove" ? (
            <span className="anim-reaction-drift-down text-neutral opacity-90 drop-shadow-sm">
              <BookmarkOff className="size-3.5 fill-neutral" />
            </span>
          ) : (
            <>
              <span className="anim-reaction-float-1 absolute text-brand-primary drop-shadow-[0_0_6px_rgba(37,99,235,0.8)]">
                <BookmarkPlus className="size-3.5 fill-brand-primary" />
              </span>
              <span className="anim-reaction-float-2 absolute text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]">
                <BookmarkPlus className="size-4.5 fill-blue-400" />
              </span>
              <span className="anim-reaction-float-3 absolute text-sky-300 drop-shadow-[0_0_6px_rgba(125,211,252,0.8)]">
                <BookmarkPlus className="size-3 fill-sky-300" />
              </span>
            </>
          )}
        </span>
      )}

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
      ) : isInLibrary ? (
        <BookmarkOff className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <BookmarkPlus className="h-4 w-4 transition-transform duration-200" />
      )}
    </button>
  );
}
