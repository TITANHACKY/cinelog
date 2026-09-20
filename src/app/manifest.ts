import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CineLog - Your Personal Movie Log",
    short_name: "CineLog",
    description:
      "Track movies, TV series, build smart collections, and log your cinema journey.",
    start_url: "/",
    id: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#121314",
    theme_color: "#121314",
    orientation: "portrait-primary",
    scope: "/",
    categories: ["entertainment", "movies", "lifestyle"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo-dark-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-dark-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-light-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-light-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo_dark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo_dark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/logo_light.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo_light.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "My Library",
        short_name: "Library",
        description: "View your saved movies, series, and custom lists",
        url: "/library",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Settings",
        short_name: "Settings",
        description: "Customize theme, profile, and collections",
        url: "/settings",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
