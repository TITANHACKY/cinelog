"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end" | "responsive";
  id?: string;
};

export function Tooltip({
  content,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  contentClassName,
  side = "top",
  align = "responsive",
  id,
}: TooltipProps) {
  const isControlled = controlledIsOpen !== undefined;
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledIsOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const containerRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) setOpen(false);
  }, isOpen);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  const sideClasses =
    side === "top"
      ? "bottom-full mb-2 origin-bottom"
      : "top-full mt-2 origin-top";

  const alignContainerClasses =
    align === "start"
      ? "left-0"
      : align === "end"
        ? "right-0"
        : align === "responsive"
          ? "left-0 sm:left-1/2 sm:-translate-x-1/2"
          : "left-1/2 -translate-x-1/2";

  const alignArrowClasses =
    align === "start"
      ? "left-2"
      : align === "end"
        ? "right-2"
        : align === "responsive"
          ? "left-2 sm:left-1/2 sm:-translate-x-1/2"
          : "left-1/2 -translate-x-1/2";

  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      ref={containerRef}
    >
      <div
        aria-expanded={isOpen}
        className="inline-flex items-center"
        onClick={() => setOpen(!isOpen)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
      >
        {children}
      </div>

      <div
        aria-hidden={!isOpen}
        className={cn(
          "absolute z-40 transition-all duration-200 ease-out",
          sideClasses,
          alignContainerClasses,
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-1 scale-95 opacity-0",
          contentClassName,
        )}
        id={id}
        role="tooltip"
      >
        <div className="relative rounded-lg border border-outline-alt bg-surface-container p-2.5 shadow-xl shadow-black/25 backdrop-blur-md">
          <div className="font-public-sans text-xs leading-relaxed text-on-surface select-text">
            {content}
          </div>
          {side === "top" ? (
            <span
              aria-hidden="true"
              className={cn(
                "absolute -bottom-1 size-2 rotate-45 border-b border-r border-outline-alt bg-surface-container",
                alignArrowClasses,
              )}
            />
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                "absolute -top-1 size-2 rotate-45 border-l border-t border-outline-alt bg-surface-container",
                alignArrowClasses,
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
