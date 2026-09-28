import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingOverlayProps = {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  className?: string;
};

export function LoadingOverlay({
  message = "Content is loading...",
  subMessage = "Please wait a moment",
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      aria-label={message}
      aria-live="polite"
      className={cn(
        fullScreen
          ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/75 px-4 backdrop-blur-md dark:bg-surface/80"
          : "absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/70 px-4 backdrop-blur-sm dark:bg-surface/75",
        "animate-fade-in",
        className,
      )}
      role="status"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-low/95 px-6 py-5 text-center shadow-[0_12px_32px_rgb(0_0_0/20%)] sm:gap-3.5 sm:px-8 sm:py-6 max-w-[min(90vw,22rem)]">
        <div className="flex size-11 items-center justify-center rounded-xl bg-brand-primary-container/15 sm:size-12">
          <Loader2 className="size-6 animate-spin text-brand-primary sm:size-7" />
        </div>
        <div className="space-y-1">
          <p className="font-heading text-sm font-semibold tracking-tight text-on-surface sm:text-base">
            {message}
          </p>
          {subMessage ? (
            <p className="font-public-sans text-xs text-secondary">
              {subMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
