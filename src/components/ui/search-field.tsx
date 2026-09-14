import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchFieldProps = Omit<React.ComponentProps<typeof Input>, "onChange"> & {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  showClearButton?: boolean;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
};

function SearchField({
  className,
  endIcon,
  onClear,
  onValueChange,
  showClearButton = true,
  startIcon,
  value,
  ...props
}: SearchFieldProps) {
  const hasValue = Boolean(value);
  const showEndIcon = showClearButton && hasValue && endIcon;

  return (
    <div
      className={cn(
        "relative flex h-10 w-full min-w-0 items-center rounded-xl border border-outline-alt bg-surface shadow-[0_0_0_2px_rgb(51_102_204/30%)] transition-colors sm:h-10",
        className,
      )}
    >
      {startIcon ? (
        <span className="pointer-events-none absolute left-3 flex size-4.5 items-center justify-center text-outline-muted sm:left-4 sm:size-5 [&>svg]:size-full">
          {startIcon}
        </span>
      ) : null}
      <Input
        {...props}
        aria-label={props["aria-label"] ?? "Search"}
        className={cn(
          "h-full border-0 bg-transparent font-public-sans text-sm text-on-surface shadow-none outline-none ring-0 placeholder:text-sm placeholder:text-secondary focus-visible:border-0 focus-visible:ring-0 sm:text-base sm:placeholder:text-base",
          startIcon ? "pl-9.5 sm:pl-12" : "pl-3",
          endIcon ? "pr-9.5 sm:pr-12" : "pr-3",
        )}
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value}
      />
      {showEndIcon ? (
        <Button
          aria-label="Clear search"
          className="absolute right-2 size-6 p-0 text-brand-primary border border-current/30 bg-current/10 hover:bg-current/20 sm:size-7"
          onClick={onClear}
          size="icon-sm"
          type="button"
          variant="darkTonal"
        >
          {endIcon}
        </Button>
      ) : null}
    </div>
  );
}

export { SearchField };
