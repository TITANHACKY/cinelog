const CACHE_NAME = "cinelog-v3";

const PUBLIC_NAV_PATHS = new Set(["/", "/login", "/signup"]);

const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/logo_dark.svg",
  "/logo_light.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-192x192.png",
  "/icon-maskable-512x512.png",
  "/apple-touch-icon.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/file.svg",
  "/tmdb_logo.svg",
  "/imdb_logo.svg",
];

function isPublicNavigation(pathname) {
  return PUBLIC_NAV_PATHS.has(pathname);
}

function isStaticAssetPath(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css")
  );
}

function shouldClearNavigationEntry(url) {
  if (url.pathname.startsWith("/api/")) {
    return true;
  }

  if (isStaticAssetPath(url.pathname)) {
    return false;
  }

  return !isPublicNavigation(url.pathname);
}

async function precacheAssets(cache) {
  await Promise.allSettled(PRECACHE_ASSETS.map((asset) => cache.add(asset)));
}

async function clearNavigationCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  await Promise.all(
    keys.map(async (request) => {
      const url = new URL(request.url);
      if (shouldClearNavigationEntry(url)) {
        await cache.delete(request);
      }
    }),
  );
}

// Install event: pre-cache critical shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => precacheAssets(cache))
      .then(() => self.skipWaiting()),
  );
});

// Activate event: clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch event: handle offline and caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Don't intercept API requests
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: cache only public pages; never serve stale auth pages
  if (request.mode === "navigate") {
    const isPublic = isPublicNavigation(url.pathname);

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isPublic && response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          if (isPublic) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
          }

          return caches.match("/");
        }),
    );
    return;
  }

  // Static assets (images, png, svg, fonts, css, js): Stale-While-Revalidate / Cache-first
  if (url.origin === self.location.origin && isStaticAssetPath(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }

  // Default: Network only (no cache fallback for dynamic RSC payloads)
  event.respondWith(fetch(request));
});

// Message event: skip waiting and clear auth-gated navigation cache on logout
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data.type === "CLEAR_NAV_CACHE") {
    event.waitUntil(clearNavigationCache());
  }
});
