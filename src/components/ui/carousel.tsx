"use client";

import { Children, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { cn } from "@/lib/utils";

type CarouselProps = {
  headingId: string;
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  extraHeader?: ReactNode;
  showNav?: boolean;
  navAlwaysVisible?: boolean;
  empty?: ReactNode;
  children?: ReactNode;
  className?: string;
  onNearEnd?: () => void;
};

export function Carousel({
  headingId,
  icon,
  title,
  subtitle,
  extraHeader,
  showNav = false,
  navAlwaysVisible = false,
  empty,
  children,
  className,
  onNearEnd,
}: CarouselProps) {
  const { ref, scroll } = useHorizontalScroll(
    400,
    onNearEnd,
    Children.count(children),
  );

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex w-full min-w-0 flex-col gap-4", className)}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary-container/20 text-brand-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={headingId}
                className="font-heading text-lg font-semibold tracking-tight text-on-surface sm:text-2xl"
              >
                {title}
              </h2>
              {extraHeader}
            </div>
            {subtitle}
          </div>
        </div>

        {showNav ? (
          <div
            className={cn(
              "ml-auto items-center gap-1.5 sm:ml-0",
              navAlwaysVisible ? "flex" : "hidden sm:flex",
            )}
          >
            <Button
              aria-label="Scroll left"
              className="h-8 w-8 rounded-full border border-current/30 bg-current/10 text-on-surface hover:bg-current/20 hover:text-on-surface"
              onClick={() => scroll("left")}
              size="icon"
              variant="ghost"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Scroll right"
              className="h-8 w-8 rounded-full border border-current/30 bg-current/10 text-on-surface hover:bg-current/20 hover:text-on-surface"
              onClick={() => scroll("right")}
              size="icon"
              variant="ghost"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {children ? (
        <div
          className="movie-lists-scrollbar -mx-1 flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain [touch-action:pan-x_pan-y] px-1 pb-2 sm:gap-4"
          ref={ref}
        >
          {children}
        </div>
      ) : (
        empty
      )}
    </section>
  );
}
