import type { Metadata, Viewport } from "next";
import { PwaManager } from "@/components/layout/pwa-manager";
import "./globals.css";
import { Providers } from "./providers";
import { Noto_Serif, Public_Sans } from "next/font/google";

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "CineLog",
  title: {
    default: "CineLog",
    template: "CineLog - %s",
  },
  description: "Your Personal Movie Log",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
      {
        url: "/logo_light.svg",
        media: "(prefers-color-scheme: light)",
        type: "image/svg+xml",
      },
      {
        url: "/logo_dark.svg",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/logo_dark.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CineLog",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dce5ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121314" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${notoSerif.variable} ${publicSans.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
  try {
    var theme = 'dark';
    var themeColor = '#121314';
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    var themeColorMeta = document.querySelector('meta[name="theme-color"][media*="dark"]');
    if (themeColorMeta) themeColorMeta.setAttribute('content', themeColor);
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <PwaManager />
        </Providers>
      </body>
    </html>
  );
}
