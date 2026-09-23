"use client";

import Image from "next/image";
import { Download, RefreshCw, Share, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwa } from "@/hooks/layout/use-pwa";
import {
  PWA_DISMISS_BUTTON_CLASS,
  PWA_ICON_FRAME_CLASS,
  PWA_ICON_SRC,
  PWA_INSTALL_BANNER_CLASS,
  PWA_INSTALL_CARD_CLASS,
  PWA_IOS_CARD_CLASS,
  PWA_OFFLINE_TOAST_CLASS,
} from "@/lib/constants";

const cardClass = {
  install: PWA_INSTALL_CARD_CLASS,
  ios: PWA_IOS_CARD_CLASS,
} as const;

function PwaAppIcon() {
  return (
    <div className={PWA_ICON_FRAME_CLASS}>
      <Image
        src={PWA_ICON_SRC}
        alt="CineLog App Icon"
        fill
        className="object-contain p-1"
      />
    </div>
  );
}

function DismissButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={PWA_DISMISS_BUTTON_CLASS}
    >
      <X className="size-4" />
    </button>
  );
}

export function PwaManager() {
  const {
    isInstallable,
    isIOS,
    isOnline,
    hasUpdate,
    promptInstall,
    dismissPrompt,
    applyUpdate,
  } = usePwa();

  return (
    <>
      {!isOnline ? (
        <div
          role="status"
          aria-live="polite"
          className={PWA_OFFLINE_TOAST_CLASS}
        >
          <WifiOff className="size-3.5 shrink-0" />
          <span>You are offline. Some features may be unavailable.</span>
        </div>
      ) : null}

      {hasUpdate ? (
        <div
          role="dialog"
          aria-label="Update CineLog"
          className={PWA_INSTALL_BANNER_CLASS}
        >
          <div className={cardClass.install}>
            <div className="flex min-w-0 items-center gap-3">
              <PwaAppIcon />
              <p className="min-w-0 text-sm font-semibold text-on-surface">
                A new version of CineLog is available
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="primaryFilled"
                onClick={applyUpdate}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                <RefreshCw className="size-3.5" />
                <span>Update</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isInstallable ? (
        <div
          role="dialog"
          aria-label="Install CineLog"
          className={PWA_INSTALL_BANNER_CLASS}
        >
          <div className={cardClass.install}>
            <div className="flex min-w-0 items-center gap-3">
              <PwaAppIcon />
              <p className="min-w-0 text-sm font-semibold text-on-surface">
                Install CineLog App
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="primaryFilled"
                onClick={promptInstall}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                <Download className="size-3.5" />
                <span>Install</span>
              </Button>
              <DismissButton
                label="Dismiss install prompt"
                onClick={dismissPrompt}
              />
            </div>
          </div>
        </div>
      ) : null}

      {isIOS ? (
        <div
          role="dialog"
          aria-label="Install on iOS"
          className={PWA_INSTALL_BANNER_CLASS}
        >
          <div className={cardClass.ios}>
            <div className="flex min-w-0 items-start gap-3">
              <PwaAppIcon />
              <div className="min-w-0 text-xs text-on-surface">
                <p className="font-semibold">Install CineLog on iOS</p>
                <p className="mt-0.5 text-secondary">
                  Tap <Share className="inline size-3.5 text-brand-primary" />{" "}
                  Share and choose{" "}
                  <span className="font-medium text-on-surface">
                    &ldquo;Add to Home Screen&rdquo;
                  </span>
                </p>
              </div>
            </div>
            <DismissButton
              label="Dismiss iOS install instructions"
              onClick={dismissPrompt}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
