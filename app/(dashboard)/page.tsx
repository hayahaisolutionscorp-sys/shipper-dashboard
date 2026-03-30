"use client";

import dynamic from "next/dynamic";
import { IconCalendar } from "@tabler/icons-react";
import {
  authService,
  type Vehicle,
  type AssignedRoute,
} from "@/services/auth.service";
import { useQuery } from "@tanstack/react-query";
import { StatsSkeleton, ChartsSkeleton, ListSkeleton } from "@/components/dashboard/skeletons";

const DashboardStats = dynamic(() => import("@/components/dashboard/dashboard-stats"), {
  loading: () => <StatsSkeleton />,
  ssr: false,
});
const DashboardCharts = dynamic(() => import("@/components/dashboard/dashboard-charts"), {
  loading: () => <ChartsSkeleton />,
  ssr: false,
});
const RecentBookings = dynamic(() => import("@/components/dashboard/recent-bookings"), {
  loading: () => <ListSkeleton />,
  ssr: false,
});
const FleetStatus = dynamic(() => import("@/components/dashboard/fleet-status"), {
  loading: () => <ListSkeleton />,
  ssr: false,
});
const ActivityFeed = dynamic(() => import("@/components/dashboard/activity-feed"), {
  ssr: false,
});

interface DashboardStatsData {
  vehicles: number;
  personnel: number;
  routes: number;
  partnerLines: number;
  activeVehicles: number;
  drivers: number;
  helpers: number;
}

export default function DashboardPage() {
  const shipperData = authService.getStoredData();

  const { data: fleetData, isPending: isLoadingFleet } = useQuery({
    queryKey: ["dashboard-fleet"],
    queryFn: async () => {
      const [vResult, pResult, rResult] = await Promise.allSettled([
        authService.getVehicles(),
        authService.getPersonnel(),
        authService.getRoutes(),
      ]);

      const vehicles = vResult.status === "fulfilled" ? vResult.value : [];
      const personnel = pResult.status === "fulfilled" ? pResult.value : [];
      const routes = rResult.status === "fulfilled" ? (Array.isArray(rResult.value) ? rResult.value : (rResult.value as any)?.routes ?? []) : [];

      const tenantIds = new Set(routes.map((r: AssignedRoute) => r.tenant_id));
      return {
        stats: {
          vehicles: vehicles.length,
          personnel: personnel.length,
          routes: routes.length,
          partnerLines: tenantIds.size,
          activeVehicles: vehicles.filter((v: Vehicle) => v.status === "active").length,
          drivers: personnel.filter((p: any) => p.role === "driver").length,
          helpers: personnel.filter((p: any) => p.role === "helper").length,
        },
        recentVehicles: vehicles.slice(0, 5),
      };
    },
  });

  const { data: bookingData, isPending: isLoadingBookings } = useQuery({
    queryKey: ["dashboard-bookings"],
    queryFn: async () => {
      const [bStats, bRecent] = await Promise.allSettled([
        authService.getBookingStats(),
        // Use same params as bookings tab first page so both share the same API cache
        authService.getBookings({ limit: 20, offset: 0 }),
      ]);

      const bookings = bRecent.status === "fulfilled" ? (bRecent.value?.bookings ?? []) : [];
      return {
        stats: bStats.status === "fulfilled" ? bStats.value : null,
        recent: bookings.slice(0, 5),
      };
    },
    refetchInterval: 60 * 1000,
  });

  const stats = fleetData?.stats || {
    vehicles: 0,
    personnel: 0,
    routes: 0,
    partnerLines: 0,
    activeVehicles: 0,
    drivers: 0,
    helpers: 0,
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">Welcome back</p>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {shipperData?.shipper?.name || "Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your fleet and booking performance
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 border border-border/50 rounded-xl text-sm font-medium text-foreground bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-muted/50 cursor-pointer transition-all">
            <IconCalendar className="size-4 text-muted-foreground" />
            <span>Last 30 Days</span>
          </div>
        </div>
      </header>

      {isLoadingFleet ? (
        <StatsSkeleton />
      ) : (
        <DashboardStats
          {...stats}
          bookingStats={bookingData?.stats || null}
        />
      )}

      {isLoadingBookings ? (
        <ChartsSkeleton />
      ) : (
        <DashboardCharts bookingStats={bookingData?.stats || null} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoadingBookings ? (
          <ListSkeleton />
        ) : (
          <RecentBookings bookings={bookingData?.recent || []} isLoading={false} />
        )}

        {isLoadingFleet ? (
          <ListSkeleton />
        ) : (
          <FleetStatus vehicles={fleetData?.recentVehicles || []} isLoading={false} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
      </div>
    </div>
  );
}
