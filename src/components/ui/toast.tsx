"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import type { ToastProps } from "@/lib/types";
import { VARIANT_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Toast({
  message,
  onDismiss,
  duration = 3000,
  variant = "success",
  action,
}: ToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, duration);

    return () => window.clearTimeout(timeout);
  }, [duration, onDismiss]);

  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.success;
  const Icon = config.icon;

  return (
    <div className="pointer-events-none fixed top-16 right-0 z-[100] flex w-full max-w-md flex-col items-end gap-2 p-3 sm:w-auto sm:p-4">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-surface-container px-4 py-3 pr-10 text-sm text-on-surface shadow-2xl shadow-black/30",
          config.border,
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
            config.iconBg,
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <span className="leading-5 font-medium">{message}</span>
          {action && (
            <a
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary underline hover:text-brand-primary/80 transition-colors w-fit"
              href={action.href}
              rel="noopener noreferrer"
              target="_blank"
              onClick={onDismiss}
            >
              <span>{action.label}</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={onDismiss}
          className="absolute top-2 right-2 min-h-8 min-w-8 rounded-md p-1 text-neutral transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
