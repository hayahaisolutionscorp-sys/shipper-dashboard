"use client";

import { IconCar } from "@tabler/icons-react";
import type { Vehicle } from "@/services/auth.service";

interface FleetStatusProps {
  vehicles: Vehicle[];
  isLoading?: boolean;
}

export default function FleetStatus({ vehicles, isLoading }: FleetStatusProps) {
  return (
    <section className="bg-card rounded-2xl border border-border/50 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <header className="px-6 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">Fleet Status</h3>
        </div>
        <a href="/vehicles" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          Manage Fleet
        </a>
      </header>

      <div className="p-2 flex flex-col gap-1">
        {isLoading ? (
          <div className="p-1 space-y-1 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="size-10 rounded-xl bg-muted/40 shrink-0 hidden sm:block" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-muted/60 rounded" />
                    <div className="h-3 w-20 bg-muted/40 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="h-3 w-24 bg-muted/40 rounded" />
                    <div className="h-3 w-20 bg-muted/30 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-muted/40 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) :vehicles.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No vehicles found
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-3 rounded-xl flex items-center justify-between hover:bg-muted/50 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-10 rounded-xl bg-primary/5 hidden sm:flex items-center justify-center border border-primary/10 text-primary shrink-0 transition-colors group-hover:bg-primary/10">
                  <IconCar className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground font-mono">
                    {vehicle.plate_number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {vehicle.vehicle_type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end gap-0.5">
                  {vehicle.driver ? (
                    <span className="text-xs text-foreground font-medium flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-blue-500 shrink-0"></span>
                      {vehicle.driver.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No Driver</span>
                  )}
                  {vehicle.helper ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-violet-400 shrink-0"></span>
                      {vehicle.helper.name}
                    </span>
                  ) : null}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wide border ${vehicle.status === "active"
                  ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  : vehicle.status === "maintenance"
                    ? "bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    : "bg-muted text-muted-foreground border-border/20"
                  }`}>
                  {vehicle.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
