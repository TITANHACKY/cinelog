export function purgeNavigationCacheOnLogout() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !navigator.serviceWorker.controller
  ) {
    return;
  }

  navigator.serviceWorker.controller.postMessage({ type: "CLEAR_NAV_CACHE" });
}
