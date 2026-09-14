import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LIBRARY_EMPTY_DESCRIPTION,
  LIBRARY_EMPTY_TITLE,
} from "@/lib/constants";

export function LibrarySection({
  title,
  count,
  hasMore,
  loadingMore,
  onLoadMore,
  children,
  emptyIcon,
  showTitle = false,
}: {
  title: string;
  count: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  children: ReactNode;
  emptyIcon?: ReactNode;
  showTitle?: boolean;
}) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-heading`;

  return (
    <section
      aria-label={showTitle ? undefined : title}
      aria-labelledby={showTitle ? headingId : undefined}
      className="flex min-w-0 flex-col gap-4"
    >
      {showTitle && count > 0 ? (
        <h2
          className="font-heading text-lg tracking-tight text-on-surface sm:text-xl"
          id={headingId}
        >
          {title}
          <span className="ml-2 font-public-sans text-xs font-normal text-secondary sm:text-sm">
            {count}
          </span>
        </h2>
      ) : null}
      {count > 0 ? (
        <>
          <div className="grid grid-cols-2 justify-items-stretch gap-3 sm:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] sm:gap-x-4 sm:gap-y-6">
            {children}
          </div>
          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button
                className="min-w-32"
                disabled={loadingMore}
                onClick={onLoadMore}
                type="button"
                variant="darkFilled"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {loadingMore ? "Loading" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          className="px-4 py-8"
          description={LIBRARY_EMPTY_DESCRIPTION}
          icon={emptyIcon}
          title={LIBRARY_EMPTY_TITLE}
        />
      )}
    </section>
  );
}
