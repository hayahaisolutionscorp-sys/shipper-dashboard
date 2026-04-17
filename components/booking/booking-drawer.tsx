"use client";

import { IconX, IconReceipt, IconRoute, IconCalendarEvent, IconShip, IconLoader2 } from "@tabler/icons-react";
import type { Booking } from "@/services/auth.service";
import { useGsapDrawerPresence } from "@/lib/gsap-animations";

interface BookingDrawerProps {
  booking: Booking | null;
  onClose: () => void;
}

export function BookingDrawer({ booking, onClose }: BookingDrawerProps) {
  const { mounted, overlayRef, drawerRef } = useGsapDrawerPresence(!!booking);

  if (!mounted || !booking) return null;

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
    <div className="fixed inset-0 z-50 flex">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <IconReceipt className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground font-mono">
                {booking.reference_no}
              </h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide mt-1 ${statusColor(booking.booking_status)}`}>
                {booking.booking_status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <IconX className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Trip Details */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trip Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {booking.route_code && (
                <div className="flex items-start gap-2">
                  <IconRoute className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Route</p>
                    <p className="text-sm font-mono font-semibold">{booking.route_code}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.src_port_code} → {booking.dest_port_code}
                    </p>
                  </div>
                </div>
              )}
              {booking.scheduled_departure && (
                <div className="flex items-start gap-2">
                  <IconCalendarEvent className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Departure</p>
                    <p className="text-sm font-medium">
                      {new Date(booking.scheduled_departure).toLocaleDateString("en-PH", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
              {booking.vessel_name && (
                <div className="flex items-start gap-2">
                  <IconShip className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vessel</p>
                    <p className="text-sm font-medium">{booking.vessel_name}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Vehicle Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Vehicle Info
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-mono font-semibold">{booking.shipper_vehicle_plate || "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Vehicle</p>
                </div>
                {booking.shipper_rate_amount && (
                  <span className="text-sm font-bold tabular-nums">
                    ₱{Number(booking.shipper_rate_amount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Personnel */}
          {(booking.shipper_driver_name || booking.shipper_helper_name) && (
            <>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Assigned Personnel
                </h3>
                <div className="space-y-2">
                  {booking.shipper_driver_name && (
                    <div className="flex items-center gap-2.5 bg-muted/30 rounded-lg px-3 py-2.5">
                      <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                        D
                      </div>
                      <div>
                        <p className="text-sm font-medium">{booking.shipper_driver_name}</p>
                        <p className="text-[11px] text-muted-foreground">Driver</p>
                      </div>
                    </div>
                  )}
                  {booking.shipper_helper_name && (
                    <div className="flex items-center gap-2.5 bg-muted/30 rounded-lg px-3 py-2.5">
                      <div className="size-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-[10px] font-bold">
                        H
                      </div>
                      <div>
                        <p className="text-sm font-medium">{booking.shipper_helper_name}</p>
                        <p className="text-[11px] text-muted-foreground">Helper</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <div className="h-px bg-border" />
            </>
          )}

          {/* Metadata */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Booking Info
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tenant</p>
                <p className="font-medium">{booking.tenant_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payment</p>
                <p className="font-medium capitalize">{booking.payment_method || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created</p>
                <p className="font-medium text-xs">
                  {new Date(booking.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Booking ID</p>
                <p className="font-mono text-xs break-all">{booking.id}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
