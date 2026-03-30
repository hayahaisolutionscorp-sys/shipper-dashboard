"use client";

import {
  IconShip,
  IconArrowRight,
  IconClock,
  IconCar,
  IconUser,
  IconUsers,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";
import type { AssignedRoute, ShipperRate } from "@/services/auth.service";
import type { TripResult, BookingVehicleEntry } from "@/types/booking";

interface BookingReviewProps {
  route: AssignedRoute;
  trip: TripResult;
  vehicleEntries: BookingVehicleEntry[];
  paymentMethod: string;
  remarks: string;
  onPaymentMethodChange: (method: string) => void;
  onRemarksChange: (remarks: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  creditBalance?: number;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit (Bill Later)" },
  { value: "shipper_credits", label: "Shipper Credits" },
  { value: "collect", label: "Reserve" },
];

export function BookingReview({
  route,
  trip,
  vehicleEntries,
  paymentMethod,
  remarks,
  onPaymentMethodChange,
  onRemarksChange,
  onSubmit,
  onBack,
  isSubmitting,
  creditBalance,
}: BookingReviewProps) {
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
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const totalPersonnel = vehicleEntries.reduce(
    (acc, e) => acc + (e.driver ? 1 : 0) + e.helpers.length,
    0
  );

  const getVehicleRate = (entry: BookingVehicleEntry): ShipperRate | undefined => {
    if (!route.rates || route.rates.length === 0) return undefined;
    const typeId = entry.vehicle_type_id_override ?? entry.vehicle.vehicle_type_id;
    if (typeId) {
      const match = route.rates.find((r) => r.vehicle_type_id === typeId);
      if (match) return match;
    }
    const typeName = entry.vehicle_type_override ?? entry.vehicle.vehicle_type;
    return route.rates.find(
      (r) => r.vehicle_type_name.toLowerCase() === typeName.toLowerCase(),
    );
  };

  const vehicleRates = vehicleEntries.map((entry) => {
    const rate = getVehicleRate(entry);
    return rate ? Number(parseFloat(rate.amount)) : 0;
  });

  const estimatedTotal = vehicleRates.reduce((sum, r) => sum + r, 0);
  const hasAnyRate = vehicleRates.some((r) => r > 0);

  return (
    <div className="space-y-4">
      {/* Trip Summary */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Trip Details
        </h3>

        <div className="flex items-center gap-4">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconShip className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {trip.vessel_name || "Vessel"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {route.tenant_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Departure</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {route.src_port_name}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <IconClock className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatDate(trip.departure_date)}
              </span>
            </div>
            <p className="text-xs font-mono text-foreground mt-0.5">
              {formatTime(trip.departure_date, trip.departure_time)}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <IconArrowRight className="size-4 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground">
              {route.route_code}
            </span>
          </div>

          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Arrival</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {route.dest_port_name}
            </p>
            {trip.arrival_date && (
              <>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <IconClock className="size-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(trip.arrival_date)}
                  </span>
                </div>
                <p className="text-xs font-mono text-foreground mt-0.5">
                  {formatTime(trip.arrival_date, trip.arrival_time)}
                </p>
              </>
            )}
          </div>
        </div>

        {hasAnyRate && route.rates && route.rates.length > 0 && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-1.5">
            <span className="text-xs font-medium text-primary">
              Rates by vehicle type
            </span>
            {route.rates.map((r) => (
              <div key={r.vehicle_type_id} className="flex items-center justify-between">
                <span className="text-xs text-primary/70">{r.vehicle_type_name}</span>
                <span className="text-sm font-bold tabular-nums text-primary">
                  ₱{Number(parseFloat(r.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicles Summary */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Vehicles & Personnel
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconCar className="size-3" />
              {vehicleEntries.length} vehicle{vehicleEntries.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <IconUsers className="size-3" />
              {totalPersonnel} personnel
            </span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {vehicleEntries.map((entry, index) => (
            <div key={entry.vehicle.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <IconCar className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium text-foreground">
                      {entry.vehicle.plate_number}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {entry.vehicle_type_override ?? entry.vehicle.vehicle_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {entry.driver && (
                      <span className="flex items-center gap-1">
                        <IconUser className="size-3" />
                        {entry.driver.name}
                      </span>
                    )}
                    {entry.helpers.length > 0 && (
                      <span className="flex items-center gap-1">
                        <IconUsers className="size-3" />
                        {entry.helpers.map((h) => h.name).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                {vehicleRates[index] > 0 && (
                  <span className="text-sm font-bold tabular-nums text-foreground shrink-0">
                    ₱{vehicleRates[index].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment & Remarks */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Payment & Notes
        </h3>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Payment Method
          </label>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => onPaymentMethodChange(method.value)}
                className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  paymentMethod === method.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
          {paymentMethod === "collect" && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Your booking will be <strong>reserved</strong> and pending confirmation by the shipping line. You will receive a reference number to present on arrival.
              </p>
            </div>
          )}
          {paymentMethod === "shipper_credits" && (
            <div className={`p-3 rounded-lg border ${
              creditBalance !== undefined && creditBalance < estimatedTotal
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Available Balance</p>
                <p className={`text-sm font-bold tabular-nums ${
                  creditBalance !== undefined && creditBalance < estimatedTotal
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {creditBalance !== undefined
                    ? `₱${creditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : "Loading..."}
                </p>
              </div>
              {creditBalance !== undefined && creditBalance < estimatedTotal && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Insufficient balance. You need ₱{(estimatedTotal - creditBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} more.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Remarks (Optional)
          </label>
          <textarea
            placeholder="Additional notes for this booking..."
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </div>

      {/* Estimated Total */}
      {hasAnyRate && (
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary">
                Estimated Total
              </p>
              <p className="text-xs text-primary/70 mt-0.5">
                {vehicleEntries.length} vehicle{vehicleEntries.length !== 1 ? "s" : ""}
              </p>
            </div>
            <p className="text-xl font-bold tabular-nums text-primary">
              ₱{estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || vehicleEntries.length === 0 || (paymentMethod === "shipper_credits" && creditBalance !== undefined && creditBalance < estimatedTotal)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <>
              <IconLoader2 className="size-4 animate-spin" />
              {paymentMethod === "collect" ? "Reserving..." : "Creating Booking..."}
            </>
          ) : (
            <>
              <IconCheck className="size-4" />
              {paymentMethod === "collect"
                ? `Reserve Booking (${vehicleEntries.length} vehicle${vehicleEntries.length !== 1 ? "s" : ""})`
                : `Create Booking (${vehicleEntries.length} vehicle${vehicleEntries.length !== 1 ? "s" : ""})`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
