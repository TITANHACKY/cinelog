"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ReactionButtonProps = {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  labelClassName?: string;
  iconOnly?: boolean;
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

const getReactionButtonClasses = (label: string, active: boolean) => {
  if (!active) {
    return "border-transparent bg-surface-container text-on-surface hover:bg-surface-container-highest active:bg-surface-container-high";
  }

  const normalized = label.trim().toLowerCase();
  if (normalized === "like") {
    return "border-status-info/50 bg-status-info/20 text-status-info shadow-[0_0_12px_rgba(56,189,248,0.25)] ring-1 ring-status-info/40 hover:bg-status-info/25";
  }
  if (normalized === "love") {
    return "border-status-error/50 bg-status-error/20 text-status-error shadow-[0_0_16px_rgba(239,68,68,0.3)] ring-1 ring-status-error/40 hover:bg-status-error/25";
  }
  if (normalized === "dislike") {
    return "border-neutral/40 bg-neutral/20 text-neutral shadow-sm ring-1 ring-neutral/40 hover:bg-neutral/25";
  }

  return "border-brand-primary bg-brand-primary/20 text-brand-primary shadow-sm ring-1 ring-brand-primary/40 hover:bg-brand-primary/25";
};

const getReactionIconClasses = (label: string, active: boolean) => {
  const normalized = label.trim().toLowerCase();
  if (normalized === "like") {
    return active
      ? "text-status-info fill-status-info scale-110"
      : "text-status-info/70 group-hover/button:text-status-info group-hover/button:scale-105";
  }
  if (normalized === "love") {
    return active
      ? "text-status-error fill-status-error scale-110"
      : "text-status-error/70 group-hover/button:text-status-error group-hover/button:scale-105";
  }
  if (normalized === "dislike") {
    return active
      ? "text-neutral fill-neutral scale-110"
      : "text-neutral/70 group-hover/button:text-neutral group-hover/button:scale-105";
  }

  return active
    ? "text-brand-primary fill-brand-primary scale-110"
    : "text-secondary group-hover/button:text-on-surface";
};

export function ReactionButton({
  icon: Icon,
  iconClassName = "",
  label,
  labelClassName = "",
  iconOnly = false,
  active = false,
  loading = false,
  disabled = false,
  className = "",
  onClick,
}: ReactionButtonProps) {
  const [animKey, setAnimKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevActiveRef = useRef(active);

  // Trigger sparks and squash when active transitions to true (e.g. from state/mutation)
  useEffect(() => {
    if (!prevActiveRef.current && active) {
      setAnimKey((k) => k + 1);
      setIsAnimating(true);
    }
    prevActiveRef.current = active;
  }, [active]);

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
      setAnimKey((k) => k + 1);
      if (!active) {
        setIsAnimating(true);
      }
    }
    onClick?.();
  };

  const normalized = label.trim().toLowerCase();

  return (
    <Button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={label}
      title={label}
      variant={active ? "primaryFilled" : "darkFilled"}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-visible rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95",
        getReactionButtonClasses(label, active),
        isAnimating && "anim-reaction-squash",
        iconOnly && "size-9 p-0",
        className,
      )}
    >
      {/* Live Floating Reaction Sparks */}
      {isAnimating && (
        <span
          key={`sparks-${normalized}-${animKey}`}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center select-none"
        >
          {normalized === "dislike" && (
            <span className="anim-reaction-drift-down text-neutral opacity-90 drop-shadow-sm">
              <Icon className="size-4 fill-neutral" />
            </span>
          )}
          {normalized === "like" && (
            <>
              <span className="anim-reaction-float-1 absolute text-status-info drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]">
                <Icon className="size-4 fill-status-info" />
              </span>
              <span className="anim-reaction-float-2 absolute text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]">
                <Icon className="size-5 fill-sky-400" />
              </span>
              <span className="anim-reaction-float-3 absolute text-cyan-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]">
                <Icon className="size-3.5 fill-cyan-300" />
              </span>
            </>
          )}
          {normalized === "love" && (
            <>
              <span className="anim-reaction-float-1 absolute text-status-error drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]">
                <Icon className="size-4 fill-status-error" />
              </span>
              <span className="anim-reaction-float-2 absolute text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]">
                <Icon className="size-5.5 fill-rose-400" />
              </span>
              <span className="anim-reaction-float-3 absolute text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]">
                <Icon className="size-3.5 fill-pink-300" />
              </span>
            </>
          )}
          {normalized !== "dislike" &&
            normalized !== "like" &&
            normalized !== "love" && (
              <>
                <span className="anim-reaction-float-1 absolute text-brand-primary drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]">
                  <Icon className="size-4 fill-brand-primary" />
                </span>
                <span className="anim-reaction-float-2 absolute text-brand-primary/80 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]">
                  <Icon className="size-5 fill-brand-primary/80" />
                </span>
                <span className="anim-reaction-float-3 absolute text-brand-primary/60 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]">
                  <Icon className="size-3.5 fill-brand-primary/60" />
                </span>
              </>
            )}
        </span>
      )}

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
      ) : (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            getReactionIconClasses(label, active),
            iconClassName,
          )}
        />
      )}
      {iconOnly ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className={cn("truncate", labelClassName)}>{label}</span>
      )}
    </Button>
  );
}

export default ReactionButton;
