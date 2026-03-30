"use client";

import { motion } from "framer-motion";
import { IconArrowUpRight } from "@tabler/icons-react";
import type { BookingStats } from "@/services/auth.service";

interface DashboardChartsProps {
  bookingStats: BookingStats | null;
}

export default function DashboardCharts({ bookingStats }: DashboardChartsProps) {
  const monthlyData = bookingStats?.bookings_by_month ?? [];
  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);
  const routeData = bookingStats?.revenue_by_route?.slice(0, 5) ?? [];
  const maxRevenue = Math.max(...routeData.map((r) => r.revenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <header className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Booking Volume</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly booking trends</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-blue-500"></span> Bookings
            </span>
          </div>
        </header>

        <div className="relative h-64 md:h-72 w-full flex items-end justify-between gap-2 md:gap-4 pt-4 px-2">
          {/* Background Grid Lines */}
          <div className="absolute inset-x-0 inset-y-8 flex flex-col justify-between pointer-events-none z-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full border-t border-dashed border-border" />
            ))}
          </div>
          {monthlyData.length > 0 ? (
            monthlyData.map((m, i) => {
              const height = Math.max((m.count / maxMonthly) * 100, 4);
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                  <div className="relative w-full flex items-end justify-center h-full z-10">
                    <motion.div
                      className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-blue-600/40 to-blue-500/90 dark:from-blue-500/40 dark:to-blue-400/90 group-hover:opacity-80 transition-opacity shadow-sm border-t border-blue-400/50"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-md border border-border pointer-events-none z-10 whitespace-nowrap font-medium">
                      {m.count} bookings
                    </div>
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {new Date(`${m.month}-01`).toLocaleDateString("en", { month: "short" })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
              No booking data available
            </div>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <header className="mb-6">
          <h3 className="text-base font-semibold text-foreground">Top Routes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Highest revenue generating routes</p>
        </header>

        <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
          {routeData.length > 0 ? (
            routeData.map((r, i) => {
              const width = Math.max((r.revenue / maxRevenue) * 100, 4);
              return (
                <div key={`${r.route}-${i}`} className="group">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-foreground truncate max-w-[150px]" title={r.route}>
                      {r.route}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      ₱{r.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600/40 to-violet-500/90 dark:from-violet-500/40 dark:to-violet-400/90"
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + (i * 0.1) }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border min-h-[150px]">
              No route data available
            </div>
          )}

          {routeData.length > 0 && (
            <div className="pt-2">
              <button className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
                View full report <IconArrowUpRight className="size-3" />
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
