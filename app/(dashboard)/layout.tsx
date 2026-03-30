"use client";

import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PageTransition } from "@/components/motion/page-transition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      window.location.replace("/login");
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex bg-background animate-pulse">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex flex-col w-64 border-r border-border/50 p-4 gap-4 shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="size-8 rounded-lg bg-muted/60" />
            <div className="h-4 w-24 bg-muted/60 rounded" />
          </div>
          {/* Nav items */}
          <div className="flex flex-col gap-1 mt-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                <div className="size-4 bg-muted/50 rounded" />
                <div className="h-3 bg-muted/40 rounded flex-1" style={{ width: `${55 + (i % 3) * 15}%` }} />
              </div>
            ))}
          </div>
          {/* Bottom user area */}
          <div className="mt-auto flex items-center gap-3 px-3 py-3 border-t border-border/50">
            <div className="size-8 rounded-full bg-muted/50" />
            <div className="space-y-1 flex-1">
              <div className="h-3 w-24 bg-muted/50 rounded" />
              <div className="h-2.5 w-32 bg-muted/30 rounded" />
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-6 md:p-8 space-y-6">
          {/* Page header */}
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted/40 rounded" />
            <div className="h-7 w-48 bg-muted/60 rounded" />
            <div className="h-3 w-64 bg-muted/40 rounded" />
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-muted/50 rounded" />
                  <div className="size-8 rounded-lg bg-muted/40" />
                </div>
                <div className="h-8 w-20 bg-muted/60 rounded" />
                <div className="h-3 w-32 bg-muted/30 rounded" />
              </div>
            ))}
          </div>
          {/* Content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 h-72" />
            <div className="bg-card rounded-2xl border border-border/50 h-72" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background relative selection:bg-primary/20">
      <div className="relative z-10 hidden md:flex">
        <AppSidebar />
      </div>
      <div className="relative z-10 md:hidden block">
        <AppSidebar />
      </div>

      <main className="flex-1 overflow-auto relative z-10 md:ml-0 custom-scrollbar">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
