"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  Library,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  X,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useLogoutMutation } from "@/store/api/auth-api";
import { useAppSelector } from "@/store";
import { SETTINGS_ROOT_ITEM } from "@/lib/constants/settings";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "My library", href: "/library", icon: Library },
  { label: "Guide", href: "/guide", icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const SettingsIcon = SETTINGS_ROOT_ITEM.icon;

  const handleLogout = () => {
    void logout();
  };

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-outline-alt bg-surface/95 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)] lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      >
        {navigation.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-1 text-xs font-medium font-public-sans transition-colors",
                active
                  ? "text-brand-primary"
                  : "text-secondary hover:text-on-surface",
              )}
              aria-current={active ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  active ? "bg-brand-primary-container/20" : "bg-transparent",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span
                className={cn(
                  "text-[11px] leading-tight text-center truncate max-w-full px-0.5",
                  active && "font-semibold",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          className={cn(
            "flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-1 text-xs font-medium font-public-sans transition-colors",
            isMenuOpen
              ? "text-brand-primary"
              : "text-secondary hover:text-on-surface",
          )}
        >
          <div
            className={cn(
              "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
              isMenuOpen ? "bg-brand-primary-container/20" : "bg-transparent",
            )}
          >
            <Menu className="size-5" strokeWidth={1.8} />
          </div>
          <span className="text-[11px] leading-tight text-center truncate max-w-full px-0.5">
            Menu
          </span>
        </button>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMenuOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quick menu"
            className="relative z-10 w-full max-w-lg rounded-t-2xl border-t border-x border-outline-alt bg-surface-container p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-outline-alt">
              <div className="flex items-center gap-2.5">
                <span className="font-heading text-lg font-semibold text-on-surface">
                  Menu &amp; Preferences
                </span>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
                className="text-secondary border border-current/30 bg-current/10 hover:text-on-surface hover:bg-current/20"
              >
                <X className="size-4.5" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <Link
                href={SETTINGS_ROOT_ITEM.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-3.5 transition-colors hover:bg-surface-container-high"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary-container/20 text-brand-primary">
                    <SettingsIcon className="size-4.5" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-brand-primary">
                      {SETTINGS_ROOT_ITEM.label}
                    </span>
                    <span className="text-[11px] text-secondary">
                      {SETTINGS_ROOT_ITEM.description}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-secondary"
                  strokeWidth={1.8}
                />
              </Link>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-container text-white border border-outline-alt shadow-sm">
                        <span className="text-sm font-bold uppercase">
                          {(user.displayName || user.username).charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {user.displayName || user.username}
                        </p>
                        <p className="truncate text-xs text-secondary">
                          {user.email || `@${user.username}`}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="darkFilled"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      disabled={isLoggingOut}
                      className="w-full justify-center gap-2 text-status-error border-status-error/30 hover:bg-status-error/10 hover:text-status-error"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Logout</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="size-4" />
                          <span>Logout</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        Welcome to CineLog
                      </p>
                      <p className="text-xs text-secondary">
                        Log in to sync your library and watchlist across
                        devices.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <ButtonLink
                        href="/login"
                        variant="primaryFilled"
                        onClick={() => setIsMenuOpen(false)}
                        className="justify-center gap-1.5"
                      >
                        <LogIn className="size-4" />
                        Log In
                      </ButtonLink>
                      <ButtonLink
                        href="/signup"
                        variant="darkFilled"
                        onClick={() => setIsMenuOpen(false)}
                        className="justify-center gap-1.5"
                      >
                        <UserPlus className="size-4" />
                        Create Account
                      </ButtonLink>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
