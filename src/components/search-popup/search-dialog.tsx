"use client";

import { Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { SearchField } from "@/components/ui/search-field";
import { MovieLists } from "@/components/search-popup/movie-lists";
import { FloatingSearchButton } from "@/components/search-popup/floating-search-button";
import { SearchControls } from "@/components/search-popup/search-controls";
import { SearchPagination } from "@/components/search-popup/search-pagination";
import { useSearchDialog } from "@/hooks/search-popup/use-search-dialog";
import { useSearchDialogViewport } from "@/hooks/search-popup/use-search-dialog-viewport";

export function SearchDialog() {
  const pathname = usePathname();

  return <SearchDialogContent key={pathname} />;
}

function SearchDialogContent() {
  const {
    open,
    query,
    mediaType,
    year,
    language,
    page,
    searchState,
    showPagination,
    requestSearch,
    handleOpenChange,
    handleMediaTypeChange,
    handleQueryChange,
    handleYearChange,
    handleLanguageChange,
    handlePageChange,
  } = useSearchDialog();
  const viewport = useSearchDialogViewport(open);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger render={<FloatingSearchButton />} />
      <DialogContent
        align="top"
        className="h-[min(39rem,calc(100dvh-1.5rem))] w-full max-w-[calc(100%-1.5rem)] gap-3 border border-outline-alt bg-surface-container p-3 shadow-[0_8px_24px_rgb(0_0_0/25%)] sm:h-[min(36rem,calc(100dvh-2rem))] sm:max-w-3xl sm:gap-4 sm:p-4"
        showCloseButton={false}
        style={{ height: viewport.height, top: viewport.top }}
      >
        <SearchField
          autoFocus
          className="shrink-0"
          endIcon={<X className="size-4" />}
          onClear={() => handleQueryChange("")}
          onValueChange={handleQueryChange}
          placeholder="Search movies and series"
          showClearButton
          startIcon={<Search className="size-5" />}
          value={query}
        />

        <SearchControls
          mediaType={mediaType}
          onMediaTypeChange={handleMediaTypeChange}
          language={language}
          onLanguageChange={handleLanguageChange}
          onYearChange={handleYearChange}
          year={year}
        />

        {searchState.status === "failed" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ErrorState
              compact
              message={searchState.error ?? "The search request failed."}
              onRetry={() =>
                requestSearch(page, searchState.query || query.trim())
              }
            />
          </div>
        ) : (
          <MovieLists
            mediaType={mediaType}
            onItemClick={() => handleOpenChange(false)}
            results={searchState.results}
            status={searchState.status}
          />
        )}

        {showPagination ? (
          <div className="-mx-3 -mb-3 shrink-0 border-t border-outline-alt bg-surface-container-low px-3 py-2 sm:-mx-4 sm:-mb-4 sm:px-4">
            <SearchPagination
              disabled={searchState.status === "loading"}
              onPageChange={handlePageChange}
              page={page}
              totalPages={searchState.total_pages}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
