"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconLogout, IconUser, IconChevronDown } from "@tabler/icons-react";
import { authService } from "@/services/auth.service";

export function NavUser() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<{
    shipper: { id: string; name: string };
    account: { id: string; email: string; display_name: string };
  } | null>(null);

  React.useEffect(() => {
    setUserData(authService.getStoredData());
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  const displayName = userData?.account?.display_name || userData?.account?.email || "User";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent transition-colors"
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-semibold shadow-sm">
          {initials}
        </div>
        <div className="flex-1 text-left truncate">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {userData?.shipper?.name}
          </p>
        </div>
        <IconChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-50 mb-1 rounded-md border border-border bg-popover p-1 shadow-md">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <IconLogout className="size-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
