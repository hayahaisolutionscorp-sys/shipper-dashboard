"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IconCalendar,
  IconSearch,
  IconShip,
  IconClock,
  IconArrowRight,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";
import { authService, type AssignedRoute } from "@/services/auth.service";
import type { TripResult } from "@/types/booking";
import { listVariants, itemVariants } from "@/components/motion/page-transition";

interface TripSelectorProps {
  route: AssignedRoute;
  onSelect: (trip: TripResult) => void;
  onBack: () => void;
}

export function TripSelector({ route, onSelect, onBack }: TripSelectorProps) {
  const [departureDate, setDepartureDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [trips, setTrips] = useState<TripResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!departureDate) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const results = await authService.searchTrips({
        origin_code: route.src_port_code,
        destination_code: route.dest_port_code,
        departure_date: departureDate,
        vehicle_count: 1,
      });
      setTrips(Array.isArray(results) ? results : []);
    } catch (err: any) {
      console.error("Trip search failed:", err);
      setError(err.message || "Failed to search trips");
      setTrips([]);
    } finally {
      setIsSearching(false);
    }
  }, [route, departureDate]);

  // Auto-search when entering this step (route selected) using the default date selection.
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const formatTime = (dateStr: string, timeStr?: string) => {
    if (timeStr) return timeStr;
    try {
      return new Date(dateStr).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Route Info Banner */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconShip className="size-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {route.src_port_name}
                </span>
                <IconArrowRight className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {route.dest_port_name}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-muted-foreground">
                  {route.route_code}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {route.tenant_name}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Change route
          </button>
        </div>
      </div>

      {/* Date picker and search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !departureDate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSearching ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconSearch className="size-4" />
          )}
          Search
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          <IconAlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {isSearching && (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-muted/40 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-muted/50 rounded" />
                    <div className="h-3 w-48 bg-muted/40 rounded" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-3 w-20 bg-muted/40 rounded" />
                  <div className="h-5 w-16 bg-muted/40 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSearching && hasSearched && trips.length === 0 && !error && (
        <div className="p-8 text-center bg-card rounded-xl border border-border">
          <IconShip className="size-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground">No trips found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try selecting a different date
          </p>
        </div>
      )}

      {!isSearching && trips.length > 0 && (
        <motion.div
          className="space-y-3"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {trips.map((trip) => (
            <motion.button
              key={trip.id}
              variants={itemVariants}
              type="button"
              onClick={() => onSelect(trip)}
              className="w-full bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-sm transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center border border-border/50 group-hover:bg-primary/5 transition-colors">
                    <IconShip className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {trip.vessel_name || "Vessel"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <IconClock className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(trip.departure_date)}{" "}
                        {formatTime(trip.departure_date, trip.departure_time)}
                      </span>
                      <IconArrowRight className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(trip.arrival_date || trip.departure_date)}{" "}
                        {formatTime(trip.arrival_date || trip.departure_date, trip.arrival_time)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {trip.available_vehicle_capacity != null && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">
                        {trip.available_vehicle_capacity}
                      </span>{" "}
                      vehicle slots
                    </div>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${trip.status === "available" || trip.status === "open"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                    }`}>
                    {trip.status || "available"}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
