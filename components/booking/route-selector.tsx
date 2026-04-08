"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  IconRoute,
  IconSearch,
  IconArrowRight,
  IconShip,
  IconAlertCircle,
} from "@tabler/icons-react";
import type { AssignedRoute } from "@/services/auth.service";
import { listVariants, itemVariants } from "@/components/motion/page-transition";

interface RouteSelectorProps {
  routes: AssignedRoute[];
  isLoading: boolean;
  onSelect: (route: AssignedRoute) => void;
}

// Helper to check if a route has configured rates
function hasConfiguredRates(route: AssignedRoute): boolean {
  return (route.rates && route.rates.length > 0) || !!route.rate;
}

export function RouteSelector({ routes, isLoading, onSelect }: RouteSelectorProps) {
  const [search, setSearch] = useState("");

  // Separate routes with and without rates
  const { routesWithRates, routesWithoutRates } = useMemo(() => {
    const withRates: AssignedRoute[] = [];
    const withoutRates: AssignedRoute[] = [];
    for (const route of routes) {
      if (hasConfiguredRates(route)) {
        withRates.push(route);
      } else {
        withoutRates.push(route);
      }
    }
    return { routesWithRates: withRates, routesWithoutRates: withoutRates };
  }, [routes]);

  // Group bookable routes (with rates) by tenant, filtered by search
  const filteredRoutesByTenant = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = routesWithRates.filter((r) => {
      if (!search) return true;
      return (
        r.route_code.toLowerCase().includes(term) ||
        r.src_port_name.toLowerCase().includes(term) ||
        r.dest_port_name.toLowerCase().includes(term) ||
        r.tenant_name.toLowerCase().includes(term)
      );
    });
    return filtered.reduce<Record<string, AssignedRoute[]>>((acc, route) => {
      const key = route.tenant_name || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(route);
      return acc;
    }, {});
  }, [routesWithRates, search]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted/50 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-lg bg-muted/40" />
                  <div className="h-4 w-20 bg-muted/50 rounded" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-4 w-16 bg-muted/50 rounded" />
                  <div className="h-3 w-8 bg-muted/30 rounded" />
                </div>
              </div>
              <div className="h-9 bg-muted/40 rounded-lg w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
          <IconRoute className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No routes assigned</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You don't have any assigned routes yet. Contact support for assistance.
        </p>
      </div>
    );
  }

  // All routes exist but none have rates configured
  if (routesWithRates.length === 0 && routesWithoutRates.length > 0) {
    return (
      <div className="bg-card rounded-xl border border-amber-200 bg-amber-50/50 p-12 text-center">
        <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <IconAlertCircle className="size-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No bookable routes</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You have {routesWithoutRates.length} assigned route{routesWithoutRates.length !== 1 ? "s" : ""}, but none have rates configured yet.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Please contact your shipping line to set up rates for your routes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search routes by name, port, or shipping line..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Routes grouped by tenant */}
      {Object.keys(filteredRoutesByTenant).length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No routes match your search
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredRoutesByTenant).map(([tenantName, tenantRoutes]) => (
            <div key={tenantName}>
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IconShip className="size-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{tenantName}</h3>
                <span className="text-xs text-muted-foreground">
                  {tenantRoutes.length} route{tenantRoutes.length !== 1 ? "s" : ""}
                </span>
              </div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {tenantRoutes.map((route) => (
                  <motion.button
                    key={`${route.tenant_id}-${route.route_code}`}
                    variants={itemVariants}
                    type="button"
                    onClick={() => onSelect(route)}
                    className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-sm transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="size-9 rounded-lg bg-muted/50 flex items-center justify-center border border-border/50 group-hover:bg-primary/5 transition-colors">
                          <IconRoute className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <span className="block text-sm font-semibold font-mono text-foreground">
                            {route.route_code}
                          </span>
                        </div>
                      </div>
                      {route.rates && route.rates.length > 0 ? (
                        <div className="text-right">
                          {route.rates.length === 1 ? (
                            <>
                              <span className="block text-sm font-bold tabular-nums text-foreground">
                                ₱{Number(parseFloat(route.rates[0].amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                Rate
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="block text-sm font-bold tabular-nums text-foreground">
                                ₱{Math.min(...route.rates.map((r) => Number(parseFloat(r.amount)))).toLocaleString(undefined, { minimumFractionDigits: 2 })}+
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                from
                              </span>
                            </>
                          )}
                        </div>
                      ) : route.rate ? (
                        <div className="text-right">
                          <span className="block text-sm font-bold tabular-nums text-foreground">
                            ₱{Number(parseFloat(route.rate.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            Rate
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-sm p-2.5 bg-muted/30 rounded-lg border border-border/50">
                      <span className="font-medium text-foreground truncate flex-1 text-center" title={route.src_port_name}>
                        {route.src_port_name}
                      </span>
                      <IconArrowRight className="size-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate flex-1 text-center" title={route.dest_port_name}>
                        {route.dest_port_name}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          ))}

          {/* Notice about routes without rates */}
          {routesWithoutRates.length > 0 && (
            <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <IconAlertCircle className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {routesWithoutRates.length} route{routesWithoutRates.length !== 1 ? "s" : ""} not shown
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Some assigned routes don't have rates configured yet and cannot be booked.
                    Contact your shipping line to set up rates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
