"use client";

import { useState } from "react";
import { IconReceipt } from "@tabler/icons-react";
import type { Booking } from "@/services/auth.service";
import { BookingDrawer } from "@/components/booking/booking-drawer";

interface RecentBookingsProps {
  bookings: Booking[];
  isLoading?: boolean;
}

export default function RecentBookings({ bookings, isLoading }: RecentBookingsProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";
      case "pending":
      case "requested":
        return "bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
      case "cancelled":
        return "bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  return (
    <section className="bg-card rounded-2xl border border-border/50 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <header className="px-6 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">Recent Bookings</h3>
        </div>
        <a href="/bookings" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All
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
                    <div className="h-4 w-28 bg-muted/60 rounded" />
                    <div className="h-3 w-32 bg-muted/40 rounded" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="h-6 w-20 bg-muted/40 rounded-full" />
                  <div className="h-3 w-14 bg-muted/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) :bookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No bookings found
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} onClick={() => setSelectedBooking(booking)} className="p-3 rounded-xl flex items-center justify-between hover:bg-muted/50 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-10 rounded-xl bg-primary/5 hidden sm:flex items-center justify-center border border-primary/10 text-primary shrink-0 transition-colors group-hover:bg-primary/10">
                  <IconReceipt className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground font-mono group-hover:text-primary transition-colors">
                    {booking.reference_no}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-xs mt-0.5">
                    {booking.route_code ? `${booking.src_port_code} → ${booking.dest_port_code}` : "Unknown Route"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wide border ${statusColor(booking.booking_status)}`}>
                  {booking.booking_status}
                </span>
                {booking.shipper_rate_amount && (
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    ₱{Number(booking.shipper_rate_amount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <BookingDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </section>
  );
}
