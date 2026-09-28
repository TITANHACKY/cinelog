"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { SearchDialog } from "@/components/search-popup/search-dialog";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-18 lg:pb-0 lg:pl-58">
        <Navbar />
        {children}
      </div>
      <BottomNav />
      <SearchDialog />
    </div>
  );
}
