"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Settings,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "My library", href: "/library", icon: Library },
  { label: "Guide", href: "/guide", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, mounted } = useTheme();
  const isDark = mounted ? theme === "dark" : true;

  return (
    <aside
      aria-label="Main navigation"
      className="fixed inset-y-0 left-0 z-30 hidden h-screen w-58 shrink-0 flex-col border-r border-outline-alt bg-surface-container-low lg:flex"
    >
      <Link
        href="/"
        className="flex h-14 items-center gap-3 border-b border-outline-alt px-6 transition-opacity hover:opacity-90"
      >
        <div className="relative size-9 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={isDark ? "/logo_dark.svg" : "/logo_light.svg"}
            alt="CineLog Logo"
            fill
            priority
            className="object-contain"
          />
        </div>
        <span className="font-heading text-xl font-semibold tracking-tight text-on-surface">
          CineLog
        </span>
      </Link>

      <nav
        className="flex flex-1 flex-col gap-1 px-4 py-8"
        aria-label="Main navigation"
      >
        <p className="px-3 pb-3 font-public-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-outline-muted">
          Workspace
        </p>
        {navigation.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`flex h-11 items-center gap-3 rounded-lg px-3 font-public-sans text-sm font-semibold transition-colors ${
                active
                  ? "bg-brand-primary-container/20 text-brand-primary"
                  : "text-secondary hover:bg-surface-container-high hover:text-on-surface"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4.5" strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
