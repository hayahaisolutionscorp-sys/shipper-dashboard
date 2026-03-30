"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  IconX,
  IconReceipt,
  IconRoute,
  IconCar,
  IconUser,
  IconBuilding,
  IconCalendar,
  IconCurrencyPeso,
  IconClock,
} from "@tabler/icons-react";
import type { Booking } from "@/services/auth.service";

interface BookingDrawerProps {
  booking: Booking | null;
  onClose: () => void;
}

const statusColor: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  pending:   "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  requested: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

function getStatusColor(status: string): string {
  return statusColor[status.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="shrink-0 size-8 rounded-lg bg-muted/50 flex items-center justify-center mt-0.5">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function BookingDrawer({ booking, onClose }: BookingDrawerProps) {
  return (
    <AnimatePresence>
      {booking && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <IconReceipt className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Booking Reference</p>
                  <p className="text-sm font-bold font-mono text-foreground tracking-wide">{booking.reference_no}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <IconX className="size-4" />
              </button>
            </div>

            {/* Status badge */}
            <div className="px-6 py-3 border-b border-border/50 shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.booking_status)}`}>
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {booking.booking_status}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <Row
                icon={IconBuilding}
                label="Shipping Line"
                value={booking.tenant_name}
              />
              <Row
                icon={IconRoute}
                label="Route"
                value={
                  booking.route_code ? (
                    <span>
                      <span className="font-mono">{booking.src_port_code} → {booking.dest_port_code}</span>
                      <span className="text-xs text-muted-foreground ml-2">({booking.route_code})</span>
                    </span>
                  ) : "—"
                }
              />
              {booking.src_port_name && (
                <Row
                  icon={IconClock}
                  label="Ports"
                  value={`${booking.src_port_name} → ${booking.dest_port_name}`}
                />
              )}
              {booking.scheduled_departure && (
                <Row
                  icon={IconCalendar}
                  label="Departure"
                  value={formatDateOnly(booking.scheduled_departure)}
                />
              )}
              {booking.scheduled_arrival && (
                <Row
                  icon={IconCalendar}
                  label="Arrival"
                  value={formatDateOnly(booking.scheduled_arrival)}
                />
              )}
              <Row
                icon={IconCar}
                label="Vehicle"
                value={
                  booking.shipper_vehicle_plate ? (
                    <span className="font-mono">{booking.shipper_vehicle_plate}</span>
                  ) : "—"
                }
              />
              {booking.shipper_driver_name && (
                <Row
                  icon={IconUser}
                  label="Driver"
                  value={booking.shipper_driver_name}
                />
              )}
              {booking.shipper_rate_amount && (
                <Row
                  icon={IconCurrencyPeso}
                  label="Rate"
                  value={`₱${Number(booking.shipper_rate_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                />
              )}
              <Row
                icon={IconCalendar}
                label="Booked On"
                value={formatDate(booking.created_at)}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
