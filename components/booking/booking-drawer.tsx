"use client";

import { useEffect, useState } from "react";
import { IconX, IconReceipt, IconRoute, IconCalendarEvent, IconShip, IconLoader2 } from "@tabler/icons-react";
import { authService, type Booking } from "@/services/auth.service";
import { useGsapDrawerPresence } from "@/lib/gsap-animations";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import type { PaymentBreakdown } from "@/lib/receipt/types";

interface BookingDrawerProps {
  booking: Booking | null;
  onClose: () => void;
}

export function BookingDrawer({ booking, onClose }: BookingDrawerProps) {
  const [displayBooking, setDisplayBooking] = useState<Booking | null>(booking);
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null | undefined>(undefined);
  const { mounted, overlayRef, drawerRef } = useGsapDrawerPresence(!!booking);

  useEffect(() => {
    if (booking) {
      setDisplayBooking(booking);
      setBreakdown(undefined);
      authService.getReceiptData(booking.id).then((data) => {
        setBreakdown(data?.booking?.payment_breakdown ?? null);
      }).catch(() => {
        setBreakdown(null);
      });
    }
  }, [booking]);

  useEffect(() => {
    if (!mounted && !booking) {
      setDisplayBooking(null);
      setBreakdown(undefined);
    }
  }, [mounted, booking]);

  if (!mounted || !displayBooking) return null;

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
    <OverlayPortal>
    <div className="fixed inset-0 z-50 h-dvh flex">
      <div
        ref={overlayRef}
        className="absolute inset-0 h-dvh bg-black/50 backdrop-blur-sm"
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
                {displayBooking.reference_no}
              </h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide mt-1 ${statusColor(displayBooking.booking_status)}`}>
                {displayBooking.booking_status}
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
              {displayBooking.route_code && (
                <div className="flex items-start gap-2">
                  <IconRoute className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Route</p>
                    <p className="text-sm font-mono font-semibold">{displayBooking.route_code}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {displayBooking.src_port_code} → {displayBooking.dest_port_code}
                    </p>
                  </div>
                </div>
              )}
              {displayBooking.scheduled_departure && (
                <div className="flex items-start gap-2">
                  <IconCalendarEvent className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Departure</p>
                    <p className="text-sm font-medium">
                      {new Date(displayBooking.scheduled_departure).toLocaleDateString("en-PH", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
              {displayBooking.vessel_name && (
                <div className="flex items-start gap-2">
                  <IconShip className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vessel</p>
                    <p className="text-sm font-medium">{displayBooking.vessel_name}</p>
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
                  <p className="text-sm font-mono font-semibold">{displayBooking.shipper_vehicle_plate || "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Vehicle</p>
                </div>
                {displayBooking.shipper_rate_amount && (
                  <span className="text-sm font-bold tabular-nums">
                    ₱{Number(displayBooking.shipper_rate_amount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Charge Breakdown */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Price Breakdown
            </h3>
            {breakdown === undefined ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconLoader2 className="size-3.5 animate-spin" />
                Loading charges...
              </div>
            ) : breakdown === null ? (
              <p className="text-xs text-muted-foreground">No breakdown available.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {breakdown.base_fare != null && breakdown.base_fare > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span className="tabular-nums font-medium">
                      ₱{breakdown.base_fare.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {(breakdown.charges ?? [])
                  .filter((c) => c.amount !== 0)
                  .map((c, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">{c.description}</span>
                      <span className="tabular-nums font-medium">
                        ₱{c.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                {(breakdown.taxes ?? [])
                  .filter((t) => t.amount !== 0)
                  .map((t, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">{t.description}</span>
                      <span className="tabular-nums font-medium">
                        ₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                {(breakdown.charges?.length || breakdown.taxes?.length) ? (
                  <div className="flex justify-between pt-1.5 mt-1 border-t border-border font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">
                      ₱{(
                        (breakdown.base_fare ?? 0) +
                        (breakdown.charges_total ?? 0) +
                        (breakdown.taxes_total ?? 0)
                      ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No additional charges.</p>
                )}
              </div>
            )}
          </section>

          <div className="h-px bg-border" />

          {/* Personnel */}
          {(displayBooking.shipper_driver_name || displayBooking.shipper_helper_name) && (
            <>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Assigned Personnel
                </h3>
                <div className="space-y-2">
                  {displayBooking.shipper_driver_name && (
                    <div className="flex items-center gap-2.5 bg-muted/30 rounded-lg px-3 py-2.5">
                      <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                        D
                      </div>
                      <div>
                        <p className="text-sm font-medium">{displayBooking.shipper_driver_name}</p>
                        <p className="text-[11px] text-muted-foreground">Driver</p>
                      </div>
                    </div>
                  )}
                  {displayBooking.shipper_helper_name && (
                    <div className="flex items-center gap-2.5 bg-muted/30 rounded-lg px-3 py-2.5">
                      <div className="size-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-[10px] font-bold">
                        H
                      </div>
                      <div>
                        <p className="text-sm font-medium">{displayBooking.shipper_helper_name}</p>
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
                <p className="font-medium">{displayBooking.tenant_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payment</p>
                <p className="font-medium capitalize">{displayBooking.payment_method || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created</p>
                <p className="font-medium text-xs">
                  {new Date(displayBooking.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Booking ID</p>
                <p className="font-mono text-xs break-all">{displayBooking.id}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
    </OverlayPortal>
  );
}
