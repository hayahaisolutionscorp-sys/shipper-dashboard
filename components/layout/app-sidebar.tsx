"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconCar,
  IconUsers,
  IconRoute,
  IconMenu2,
  IconX,
  IconReceipt,
  IconUsersGroup,
  IconWallet,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavUser } from "./nav-user";

const navItems = [
  { title: "Dashboard", url: "/", icon: IconDashboard },
  { title: "Bookings", url: "/bookings", icon: IconReceipt },
  { title: "Vehicles", url: "/vehicles", icon: IconCar },
  { title: "Personnel", url: "/personnel", icon: IconUsers },
  { title: "Routes", url: "/routes", icon: IconRoute },
  { title: "Credits", url: "/credits", icon: IconWallet },
  { title: "Team", url: "/team", icon: IconUsersGroup },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <header className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/15">
          <Image
            alt="Ayahay"
            className="shrink-0 object-contain"
            height={36}
            src="/hayahai-v2.png"
            width={36}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight leading-none">Shipper Portal</span>
          <span className="text-[10px] text-muted-foreground font-medium mt-0.5">by Hayahai</span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("size-[18px] shrink-0 transition-colors duration-200", isActive ? "text-primary" : "group-hover:text-foreground")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <footer className="border-t border-sidebar-border p-3">
        <NavUser />
      </footer>
    </div>
  );

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-40 flex size-10 items-center justify-center rounded-md bg-background border border-border md:hidden"
          aria-label="Open menu"
        >
          <IconMenu2 className="size-5" />
        </button>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 z-10"
                aria-label="Close menu"
              >
                <IconX className="size-5" />
              </button>
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className="hidden md:flex md:w-56 md:flex-shrink-0">
      <div className="fixed inset-y-0 left-0 w-56 border-r border-sidebar-border">
        {sidebarContent}
      </div>
    </aside>
  );
}
