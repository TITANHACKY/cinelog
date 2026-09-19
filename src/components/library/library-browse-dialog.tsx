"use client";

import { LibraryBrowseFields } from "@/components/library/library-browse-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LibraryBrowseQuery, LibraryMediaType } from "@/lib/types";

type LibraryBrowseDialogProps = {
  mediaType: LibraryMediaType;
  open: boolean;
  query: LibraryBrowseQuery;
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (query: LibraryBrowseQuery) => void;
  onApply: () => void;
  onClear: () => void;
};

export function LibraryBrowseDialog({
  mediaType,
  open,
  query,
  disabled = false,
  onOpenChange,
  onChange,
  onApply,
  onClear,
}: LibraryBrowseDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85dvh] w-full max-w-[calc(100%-1.5rem)] overflow-y-auto border-outline-alt bg-surface-container-low sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Library filters</DialogTitle>
          <DialogDescription>
            Choose one filter, one sort, and one group. Search stays in the
            toolbar.
          </DialogDescription>
        </DialogHeader>
        <LibraryBrowseFields
          disabled={disabled}
          layout="stack"
          mediaType={mediaType}
          onChange={onChange}
          query={query}
        />
        <DialogFooter>
          <Button
            disabled={disabled}
            onClick={onClear}
            type="button"
            variant="darkFilled"
          >
            Clear
          </Button>
          <Button
            disabled={disabled}
            onClick={onApply}
            type="button"
            variant="primaryFilled"
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
