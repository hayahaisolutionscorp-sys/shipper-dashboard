"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconRoute, IconArrowRight, IconShip, IconSearch, IconCalendarPlus } from "@tabler/icons-react";
import { authService, type AssignedRoute } from "@/services/auth.service";
import { listVariants, itemVariants } from "@/components/motion/page-transition";
import { RouteCardSkeleton } from "@/components/ui/skeletons";

export default function RoutesPage() {
  const router = useRouter();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: routes = [], isPending: isLoading } = useQuery({
    queryKey: ["assigned-routes"],
    queryFn: async () => {
      try {
        return await authService.getRoutes();
      } catch (error) {
        toast.error("Failed to load assigned routes");
        return [];
      }
    },
  });

  // Auto-select the first tenant once routes are loaded
  useEffect(() => {
    if (routes.length > 0 && selectedTenant === "") {
      setSelectedTenant(routes[0].tenant_name || "Unknown");
    }
  }, [routes, selectedTenant]);

  function formatRate(rate?: { amount: string; currency: string }): string {
    if (!rate) return "—";
    const amount = Number(parseFloat(rate.amount));

    try {
      const formatter = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: rate.currency || "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(amount).replace('PHP', '₱');
    } catch (e) {
      return `${rate.currency} ${amount}`;
    }
  }

  // Derived states
  const tenantNames = Array.from(new Set(routes.map(r => r.tenant_name || "Unknown")));

  const filteredRoutes = routes.filter((r) => {
    const matchesTenant = !selectedTenant || (r.tenant_name || "Unknown") === selectedTenant;
    const matchesSearch = !searchQuery ||
      r.route_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.src_port_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dest_port_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTenant && matchesSearch;
  });

  // Group routes by tenant
  const routesByTenant = filteredRoutes.reduce<Record<string, AssignedRoute[]>>((acc, route) => {
    const key = route.tenant_name || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(route);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <header>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Assigned Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Routes assigned to your shipper account across shipping lines
          </p>
        </header>

        {/* Search */}
        {!isLoading && routes.length > 0 && (
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search origin, destination, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm transition-shadow"
            />
          </div>
        )}
      </div>

      {/* Summary Pills */}
      {!isLoading && routes.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground shadow-sm">
            <span className="tabular-nums font-bold text-primary">{routes.length}</span>
            <span className="text-muted-foreground">Total Routes</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground shadow-sm">
            <span className="tabular-nums font-bold text-primary">{tenantNames.length}</span>
            <span className="text-muted-foreground">Shipping {tenantNames.length === 1 ? "Line" : "Lines"}</span>
          </div>
          {routes.filter((r) => r.rate).length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground shadow-sm">
              <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{routes.filter((r) => r.rate).length}</span>
              <span className="text-muted-foreground">With Rates</span>
            </div>
          )}
        </div>
      )}

      {/* Tenant Tabs */}
      {!isLoading && tenantNames.length > 1 && (
        <div className="flex overflow-x-auto pb-2 mb-6 custom-scrollbar">
          <div className="flex rounded-lg border border-border overflow-hidden bg-background shadow-sm p-1 w-fit gap-1">
            {tenantNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedTenant(name)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedTenant === name
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Routes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <RouteCardSkeleton key={i} />
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <IconRoute className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No routes assigned</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You don't have any assigned routes yet. Contact support for assistance.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(routesByTenant).map(([tenantName, tenantRoutes]) => (
            <div key={tenantName}>
              {/* Tenant Section Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IconShip className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{tenantName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {tenantRoutes.length} active route{tenantRoutes.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Route Cards */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={listVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "50px" }}
              >
                {tenantRoutes.map((route) => (
                  <motion.div
                    key={`${route.tenant_id}-${route.route_code}`}
                    variants={itemVariants}
                    className="bg-card rounded-2xl border border-border p-6 hover:border-foreground/20 shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center border border-border/50 group-hover:bg-primary/5 transition-colors">
                          <IconRoute className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <span className="block text-sm font-semibold font-mono text-foreground">
                            {route.route_code}
                          </span>
                          <span className="text-xs text-muted-foreground">Route Code</span>
                        </div>
                      </div>
                      {route.rate && (
                        <div className="text-right">
                          <span className="block text-sm font-bold tabular-nums text-foreground">
                            {formatRate(route.rate).replace('PHP', '₱')}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Base Rate</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3 text-sm p-3 bg-muted/30 rounded-lg border border-border/50">
                      <span className="font-medium text-foreground truncate min-w-0 flex-1 text-center" title={route.src_port_name}>
                        {route.src_port_name}
                      </span>
                      <IconArrowRight className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="font-medium text-foreground truncate min-w-0 flex-1 text-center" title={route.dest_port_name}>
                        {route.dest_port_name}
                      </span>
                    </div>

                    <button
                      onClick={() => router.push(`/bookings/create?route=${encodeURIComponent(route.route_code)}&tenant_id=${route.tenant_id}`)}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted hover:border-foreground/20 transition-all"
                    >
                      <IconCalendarPlus className="size-3.5" />
                      Book this route
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
