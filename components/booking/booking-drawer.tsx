"use client";

import { useState } from "react";
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
  IconPrinter,
  IconShip,
  IconFileText,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import type { Booking } from "@/services/auth.service";
import { BolPrintView } from "@/components/bol/BolPrintView";
import { ReceiptPrintView } from "@/components/receipt/ReceiptPrintView";

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
  const [showReceipt, setShowReceipt] = useState(false);
  const [showBol, setShowBol] = useState(false);
  const isRequested = booking?.booking_status?.toLowerCase() === "requested";
  const isPrimary = !isRequested && booking?.booking_status?.toLowerCase() !== "cancelled";

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
            {/* Primary header — mirrors TMS BookingLayout card header */}
            <div className={`shrink-0 p-5 ${
              isRequested ? "bg-amber-600" : isPrimary ? "bg-primary" : "bg-muted"
            } ${isRequested || isPrimary ? "text-white" : "text-foreground"} relative`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
              >
                <IconX className="size-4" />
              </button>

              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <IconReceipt className="size-3.5 opacity-80 shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest opacity-75">
                      Booking Receipt
                    </span>
                  </div>

                  {(booking.src_port_name || booking.src_port_code) && (
                    <h2 className="text-base font-bold leading-tight mb-3">
                      {booking.src_port_name ?? booking.src_port_code}
                      <span className="opacity-60 mx-1.5">→</span>
                      {booking.dest_port_name ?? booking.dest_port_code}
                    </h2>
                  )}

                  {/* Reference number box */}
                  <div className="bg-white/20 rounded-lg px-3 py-2 inline-block border border-white/30">
                    <p className="text-[9px] opacity-70 uppercase tracking-wide mb-0.5">Reference No.</p>
                    <p className="text-sm font-bold font-mono tracking-widest">
                      {booking.reference_no ?? "—"}
                    </p>
                  </div>
                </div>

                {/* QR code */}
                {booking.id && (
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="bg-white p-2 rounded-lg shadow-md">
                      <QRCodeSVG value={booking.id} size={64} />
                    </div>
                    <p className="text-[9px] opacity-60 text-center">Scan to verify</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status strip */}
            <div className="shrink-0 px-5 py-2.5 border-b border-border/50 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.booking_status)}`}>
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {booking.booking_status}
              </span>
              {booking.id && (
                <p className="text-[10px] text-muted-foreground font-mono truncate">{booking.id}</p>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-1">
              <Row icon={IconBuilding} label="Shipping Line" value={booking.tenant_name} />
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
              {booking.scheduled_departure && (
                <Row icon={IconCalendar} label="Departure" value={formatDateOnly(booking.scheduled_departure)} />
              )}
              {booking.scheduled_arrival && (
                <Row icon={IconCalendar} label="Arrival" value={formatDateOnly(booking.scheduled_arrival)} />
              )}
              <Row
                icon={IconCar}
                label="Vehicle"
                value={booking.shipper_vehicle_plate ? (
                  <span className="font-mono">{booking.shipper_vehicle_plate}</span>
                ) : "—"}
              />
              {booking.shipper_driver_name && (
                <Row icon={IconUser} label="Driver" value={booking.shipper_driver_name} />
              )}
              {booking.vessel_name && (
                <Row icon={IconShip} label="Vessel" value={booking.vessel_name} />
              )}
              {booking.shipper_rate_amount && (
                <Row
                  icon={IconCurrencyPeso}
                  label="Rate"
                  value={`₱${Number(booking.shipper_rate_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                />
              )}
              <Row icon={IconCalendar} label="Booked On" value={formatDate(booking.created_at)} />
            </div>

            {/* Print actions */}
            <div className="shrink-0 px-5 py-4 border-t border-border/50 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <IconPrinter className="size-4" />
                Print receipt
              </button>
              <button
                type="button"
                onClick={() => setShowBol(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <IconFileText className="size-4" />
                Print bill of lading
              </button>
            </div>

            {showReceipt && booking.id && (
              <ReceiptPrintView
                bookingId={booking.id}
                onClose={() => setShowReceipt(false)}
              />
            )}
            {showBol && booking.id && (
              <BolPrintView bookingId={booking.id} onClose={() => setShowBol(false)} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
