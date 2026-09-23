"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  PWA_DISMISS_COOLDOWN_MS,
  PWA_DISMISSED_AT_KEY,
  PWA_INSTALLED_KEY,
  PWA_SERVICE_WORKER_URL,
} from "@/lib/constants";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function readLocalStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event("storage"));
  } catch {
    // Ignore storage errors
  }
}

function isDismissCooldownActive(now = Date.now()) {
  const raw = readLocalStorage(PWA_DISMISSED_AT_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;
  return now - dismissedAt < PWA_DISMISS_COOLDOWN_MS;
}

function isStoredAsInstalled() {
  return readLocalStorage(PWA_INSTALLED_KEY) === "true";
}

function persistDismissed() {
  writeLocalStorage(PWA_DISMISSED_AT_KEY, String(Date.now()));
}

function persistInstalled() {
  writeLocalStorage(PWA_INSTALLED_KEY, "true");
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function subscribeStandalone(callback: () => void) {
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function subscribePwaStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone)
  );
}

function getIosSnapshot() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !Boolean((window as unknown as { MSStream?: unknown }).MSStream)
  );
}

function subscribeIos() {
  return () => {};
}

function getFalseSnapshot() {
  return false;
}

function getTrueSnapshot() {
  return true;
}

export function usePwa() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getTrueSnapshot,
  );
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getFalseSnapshot,
  );
  const isIosDevice = useSyncExternalStore(
    subscribeIos,
    getIosSnapshot,
    getFalseSnapshot,
  );
  const hasDismissedPrompt = useSyncExternalStore(
    subscribePwaStorage,
    isDismissCooldownActive,
    getFalseSnapshot,
  );
  const hasStoredInstall = useSyncExternalStore(
    subscribePwaStorage,
    isStoredAsInstalled,
    getFalseSnapshot,
  );

  const isInstalled = isStandalone || hasStoredInstall;

  useEffect(() => {
    if (!isStandalone || isStoredAsInstalled()) return;
    persistInstalled();
  }, [isStandalone]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      persistInstalled();
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const handleWaitingWorker = (worker: ServiceWorker | null) => {
      setWaitingWorker(worker);
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    navigator.serviceWorker
      .register(PWA_SERVICE_WORKER_URL, { scope: "/" })
      .then((registration) => {
        handleWaitingWorker(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              handleWaitingWorker(installingWorker);
            }
          });
        });
      })
      .catch((error) => {
        console.error("[PWA] Service worker registration failed:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choiceResult.outcome === "accepted") {
        persistInstalled();
      } else {
        persistDismissed();
      }
    } catch (error) {
      console.error("[PWA] Error triggering install prompt:", error);
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    persistDismissed();
    setDeferredPrompt(null);
  }, []);

  const applyUpdate = useCallback(() => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  return {
    isInstallable: Boolean(deferredPrompt) && !hasDismissedPrompt && !isInstalled,
    isInstalled,
    isIOS: isIosDevice && !isInstalled && !hasDismissedPrompt,
    isOnline,
    hasUpdate: Boolean(waitingWorker),
    promptInstall,
    dismissPrompt,
    applyUpdate,
  };
}
