"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGsapStepTransition, useGsapCardEntrance, useGsapStagger } from "@/lib/gsap-animations";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconClock,
  IconLoader2,
  IconReceipt,
  IconCalendarEvent,
  IconRoute,
  IconShip,
  IconBuilding,
  IconTruck,
  IconPrinter,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import {
  authService,
  type AssignedRoute,
  type Vehicle,
  type Personnel,
  type VehicleType,
} from "@/services/auth.service";
import type { TripResult, BookingVehicleEntry, BookingStep } from "@/types/booking";
import { logActivity } from "@/lib/activity-logger";
import { StepIndicator } from "@/components/booking/step-indicator";
import { RouteSelector } from "@/components/booking/route-selector";
import { TripSelector } from "@/components/booking/trip-selector";
import { VehicleForm } from "@/components/booking/vehicle-form";
import { BookingReview } from "@/components/booking/booking-review";
import { ReceiptPrintView } from "@/components/receipt/ReceiptPrintView";

export default function CreateBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRouteCode = searchParams.get("route");
  const preselectedTenantId = searchParams.get("tenant_id");

  // Data state
  const [routes, setRoutes] = useState<AssignedRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Booking flow state
  const [currentStep, setCurrentStep] = useState<BookingStep>("route");
  const [selectedRoute, setSelectedRoute] = useState<AssignedRoute | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripResult | null>(null);
  const [vehicleEntries, setVehicleEntries] = useState<BookingVehicleEntry[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Stable per-attempt idempotency key. Generated when the user enters the review step
  // and reused on any re-submit of the same booking attempt (e.g. after a "session refreshed"
  // error). Reset when the user starts a new booking so the next attempt gets a fresh key.
  const [bookingIdempotencyKey, setBookingIdempotencyKey] = useState<string>(() => crypto.randomUUID());
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const [tripCabins, setTripCabins] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingCabins, setIsLoadingCabins] = useState(false);

  // Success state
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    reference_no: string;
    booking_status: string;
    vehicleCount: number;
  } | null>(null);
  const [confirmationBreakdown, setConfirmationBreakdown] = useState<import("@/lib/receipt/types").PaymentBreakdown | null | undefined>(undefined);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  const [stepDirection, setStepDirection] = useState<"forward" | "back">("forward");

  // Fetch actual charge breakdown once booking is confirmed
  useEffect(() => {
    if (!bookingResult?.id) return;
    setConfirmationBreakdown(undefined);
    authService.getReceiptData(bookingResult.id).then((data) => {
      setConfirmationBreakdown(data?.booking?.payment_breakdown ?? null);
    }).catch(() => {
      setConfirmationBreakdown(null);
    });
  }, [bookingResult?.id]);

  // Track whether the user has started the booking flow (for nav guard)
  const hasStartedBooking = currentStep !== "route" || vehicleEntries.length > 0;

  // Navigation guard: warn before leaving mid-booking
  useEffect(() => {
    if (!hasStartedBooking || bookingResult) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasStartedBooking, bookingResult]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [routesData, vehiclesData, personnelData, vehicleTypesData] = await Promise.all([
          authService.getRoutes(),
          authService.getVehicles(),
          authService.getPersonnel(),
          authService.getVehicleTypes(),
        ]);
        setRoutes(routesData);
        setVehicles(vehiclesData);
        setPersonnel(personnelData);
        setVehicleTypes(vehicleTypesData);

        // Auto-select route from query params (e.g. from "Book this route" button)
        if (preselectedRouteCode && preselectedTenantId) {
          const match = routesData.find(
            (r) => r.route_code === preselectedRouteCode && String(r.tenant_id) === preselectedTenantId,
          );
          if (match) {
            setSelectedRoute(match);
            setStepDirection("forward");
            setCurrentStep("trip");
          }
        }

        // Fetch credit balance (non-blocking)
        authService.getCreditBalance().then((b) => setCreditBalance(b.balance)).catch(() => {});
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load booking data");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Step handlers
  const handleRouteSelect = useCallback((route: AssignedRoute) => {
    setStepDirection("forward");
    setSelectedRoute(route);
    setSelectedTrip(null);
    setVehicleEntries([]);
    setCurrentStep("trip");
  }, []);

  const handleTripSelect = useCallback((trip: TripResult) => {
    setStepDirection("forward");
    setSelectedTrip(trip);
    setVehicleEntries([]);
    setTripCabins([]);
    setCurrentStep("vehicles");
  }, []);

  // Fetch cabins when a trip is selected (shipper-scoped, tenant-aware)
  useEffect(() => {
    if (!selectedTrip || !selectedRoute) return;
    let cancelled = false;
    setIsLoadingCabins(true);
    authService
      .getTripCabins(selectedTrip.trip_segment_id, selectedRoute.tenant_id)
      .then((cabins) => {
        if (cancelled) return;
        setTripCabins(Array.isArray(cabins) ? cabins : []);
      })
      .catch(() => {
        if (cancelled) return;
        setTripCabins([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingCabins(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTrip, selectedRoute]);

  const handleVehiclesDone = useCallback(() => {
    if (vehicleEntries.length === 0) {
      toast.error("Please add at least one vehicle");
      return;
    }
    setStepDirection("forward");
    setCurrentStep("review");
  }, [vehicleEntries]);

  const handleBackToRoute = useCallback(() => {
    setStepDirection("back");
    setSelectedRoute(null);
    setSelectedTrip(null);
    setVehicleEntries([]);
    setBookingIdempotencyKey(crypto.randomUUID());
    setCurrentStep("route");
  }, []);

  const handleBackToTrip = useCallback(() => {
    setStepDirection("back");
    setSelectedTrip(null);
    setVehicleEntries([]);
    setBookingIdempotencyKey(crypto.randomUUID());
    setCurrentStep("trip");
  }, []);

  const handleBackToVehicles = useCallback(() => {
    setStepDirection("back");
    setCurrentStep("vehicles");
  }, []);

  const handleUpdateVehicleType = useCallback(
    (index: number, typeName: string, typeId: number) => {
      setVehicleEntries((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], vehicle_type_override: typeName || undefined, vehicle_type_id_override: typeId || undefined };
        return updated;
      });
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedRoute || !selectedTrip || vehicleEntries.length === 0) {
      toast.error("Missing booking information");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tenant_id: selectedRoute.tenant_id,
        trip_id: selectedTrip.trip_segment_id,
        route_code: selectedRoute.route_code,
        vehicles: vehicleEntries.map((entry) => {
          // Resolve vehicle_type_id from the matched rate entry so we always send
          // the tenant's canonical vehicle_type_id (FK to booking.vehicle_types),
          // not the shipper's stored ID which may differ.
          const rateTypeId = (() => {
            if (!selectedRoute?.rates?.length) return null;
            const typeId = entry.vehicle_type_id_override ?? entry.vehicle.vehicle_type_id;
            if (typeId) {
              const m = selectedRoute.rates.find((r) => r.vehicle_type_id === typeId);
              if (m) return m.vehicle_type_id;
            }
            const typeName = entry.vehicle_type_override ?? entry.vehicle.vehicle_type;
            const m = selectedRoute.rates.find(
              (r) => r.vehicle_type_name.toLowerCase() === typeName.toLowerCase(),
            );
            return m?.vehicle_type_id ?? null;
          })();
          return ({
          vehicle_id: entry.vehicle.id,
          plate_number: entry.vehicle.plate_number,
          vehicle_type: entry.vehicle_type_override ?? entry.vehicle.vehicle_type,
          vehicle_type_id: rateTypeId ?? entry.vehicle_type_id_override ?? entry.vehicle.vehicle_type_id ?? undefined,
          personnel_cabin_id: entry.personnel_cabin_id ?? undefined,
          personnel_cabin_name: entry.personnel_cabin_name ?? undefined,
          driver: entry.driver
            ? {
              id: entry.driver.id,
              name: entry.driver.name,
              phone: entry.driver.phone,
              sex: entry.driver.sex ?? null,
              date_of_birth: entry.driver.date_of_birth ?? null,
            }
            : null,
          helpers: entry.helpers.map((h) => ({
            id: h.id,
            name: h.name,
            phone: h.phone,
            sex: h.sex ?? null,
            date_of_birth: h.date_of_birth ?? null,
          })),
          });
        }),
        payment_method: paymentMethod,
        remarks: remarks || undefined,
      };

      const result = await authService.createBooking(payload, bookingIdempotencyKey);

      const status = result.booking_status;

      // Try to resolve the reference number via a follow-up fetch using the booking UUID
      let refNo = result.reference_no || "";
      if (!refNo && result.id) {
        const fetched = await authService.getBookingById(result.id);
        refNo = fetched?.reference_no || "";
      }

      toast.success(
        paymentMethod === "collect" ? "Booking reserved successfully" : "Booking created successfully",
        { description: refNo ? `Reference: ${refNo}` : "Your booking has been submitted." },
      );

      logActivity(
        "booking",
        "Booking Created",
        `${refNo || "New booking"} · ${selectedRoute.route_code} · ${vehicleEntries.length} vehicle${vehicleEntries.length !== 1 ? "s" : ""}`,
      );

      setBookingResult({
        id: result.id || "",
        reference_no: refNo,
        booking_status: status || (paymentMethod === "collect" ? "Requested" : "Confirmed"),
        vehicleCount: vehicleEntries.length,
      });
      // Booking committed — rotate key so "New Booking" starts a clean attempt
      setBookingIdempotencyKey(crypto.randomUUID());
    } catch (error: any) {
      console.error("Failed to create booking:", error);
      toast.error("Failed to create booking", {
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRoute, selectedTrip, vehicleEntries, paymentMethod, remarks, bookingIdempotencyKey]);

  const handleStepClick = useCallback(
    (targetStep: BookingStep) => {
      const steps: BookingStep[] = ["route", "trip", "vehicles", "review"];
      const currentIdx = steps.indexOf(currentStep);
      const targetIdx = steps.indexOf(targetStep);
      if (targetIdx >= currentIdx) return;

      if (targetStep === "route") handleBackToRoute();
      else if (targetStep === "trip" && selectedRoute) handleBackToTrip();
      else if (targetStep === "vehicles" && selectedRoute && selectedTrip) handleBackToVehicles();
    },
    [currentStep, selectedRoute, selectedTrip, handleBackToRoute, handleBackToTrip, handleBackToVehicles],
  );

  const handleExitBooking = useCallback(() => {
    if (!hasStartedBooking || bookingResult) {
      router.push("/bookings");
      return;
    }
    if (window.confirm("Are you sure you want to leave? Your booking progress will be lost.")) {
      router.push("/bookings");
    }
  }, [hasStartedBooking, bookingResult, router]);

  const handleCopyReference = useCallback(() => {
    if (bookingResult?.reference_no) {
      navigator.clipboard.writeText(bookingResult.reference_no);
      toast.success("Reference number copied!");
    }
  }, [bookingResult]);

  // Success / confirmation screen
  if (bookingResult) {
    const isRequested = bookingResult.booking_status === "Requested";

    const formatReceiptDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString("en-PH", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return dateStr;
      }
    };

    const formatReceiptTime = (dateStr: string, timeStr?: string) => {
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

    const getVehicleRate = (entry: BookingVehicleEntry): number => {
      if (!selectedRoute?.rates || selectedRoute.rates.length === 0) return 0;
      const typeId = entry.vehicle_type_id_override ?? entry.vehicle.vehicle_type_id;
      if (typeId) {
        const match = selectedRoute.rates.find((r) => r.vehicle_type_id === typeId);
        if (match) return Number(parseFloat(match.amount));
      }
      const typeName = entry.vehicle_type_override ?? entry.vehicle.vehicle_type;
      const match = selectedRoute.rates.find(
        (r) => r.vehicle_type_name.toLowerCase() === typeName.toLowerCase(),
      );
      return match ? Number(parseFloat(match.amount)) : 0;
    };

    const receiptVehicles = vehicleEntries.map((entry) => ({
      plate: entry.vehicle.plate_number,
      type: entry.vehicle_type_override ?? entry.vehicle.vehicle_type,
      driver: entry.driver?.name,
      helpers: entry.helpers.map((h) => h.name),
      rate: getVehicleRate(entry),
    }));
    const receiptTotal = receiptVehicles.reduce((sum, v) => sum + v.rate, 0);
    const hasRates = receiptTotal > 0;
    const cardRef = useGsapCardEntrance<HTMLDivElement>([]);
    const successBodyRef = useGsapStagger<HTMLDivElement>([bookingResult.id, bookingResult.reference_no], {
      y: 5,
      stagger: 0.022,
      duration: 0.22,
      ease: "power2.out",
    });

    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <div
          ref={cardRef}
          className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg"
        >
          {/* Primary header — mirrors TMS BookingLayout card header */}
          <div className={`p-6 ${isRequested ? "bg-amber-600" : "bg-primary"} text-white`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  {isRequested ? (
                    <IconClock className="size-4 shrink-0 opacity-90" />
                  ) : (
                    <IconCheck className="size-4 shrink-0 opacity-90" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                    {isRequested ? "Booking Reserved" : "Booking Confirmed"}
                  </span>
                </div>

                {selectedRoute && (
                  <h2 className="text-lg font-bold leading-tight mb-4">
                    {selectedRoute.src_port_name}
                    <span className="opacity-70 mx-1.5">→</span>
                    {selectedRoute.dest_port_name}
                  </h2>
                )}

                {/* Reference number box — same pattern as TMS */}
                <div className="bg-white/20 rounded-lg px-3 py-2.5 inline-block border border-white/30">
                  <p className="text-[10px] opacity-75 uppercase tracking-wide mb-0.5">Reference No.</p>
                  {bookingResult.reference_no ? (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono tracking-widest">
                        {bookingResult.reference_no}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyReference}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                        title="Copy reference number"
                      >
                        <IconCopy className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm opacity-75">To be assigned</p>
                  )}
                </div>
              </div>

              {/* QR code in header — same placement as TMS */}
              {bookingResult.id && (
                <div className="shrink-0 flex flex-col items-center gap-1.5">
                  <div className="bg-white p-2.5 rounded-xl shadow-md">
                    <QRCodeSVG value={bookingResult.id} size={72} />
                  </div>
                  <p className="text-[10px] opacity-65 text-center">Scan to verify</p>
                </div>
              )}
            </div>
          </div>

          {/* Card content */}
          <div ref={successBodyRef} className="px-6 pb-6 pt-5 space-y-5">

            {/* Booking meta */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {bookingResult.id && (
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Booking ID</p>
                  <p className="text-xs font-mono mt-0.5 text-foreground break-all">{bookingResult.id}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Status</p>
                <span className={`inline-flex items-center gap-1 mt-0.5 text-xs font-semibold ${
                  isRequested ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  <span className={`size-1.5 rounded-full animate-pulse ${isRequested ? "bg-amber-500" : "bg-emerald-500"}`} />
                  {isRequested ? "Pending Confirmation" : "Confirmed"}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Payment</p>
                <p className="text-xs font-medium mt-0.5 capitalize">{paymentMethod}</p>
              </div>
            </div>

            {/* Trip details */}
            {selectedRoute && selectedTrip && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Trip Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <IconCalendarEvent className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Departure</p>
                        <p className="text-xs font-medium mt-0.5">{formatReceiptDate(selectedTrip.departure_date)}</p>
                        <p className="text-xs text-muted-foreground">{formatReceiptTime(selectedTrip.departure_date, selectedTrip.departure_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconRoute className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Route</p>
                        <p className="text-xs font-mono font-semibold mt-0.5">{selectedRoute.route_code}</p>
                      </div>
                    </div>
                    {selectedTrip.vessel_name && (
                      <div className="flex items-start gap-2">
                        <IconShip className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vessel</p>
                          <p className="text-xs font-medium mt-0.5 truncate">{selectedTrip.vessel_name}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <IconBuilding className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Shipping Line</p>
                        <p className="text-xs font-medium mt-0.5 truncate">{selectedRoute.tenant_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Vehicles */}
            <div className="h-px bg-border" />
            <div className="space-y-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Vehicles ({bookingResult.vehicleCount})
              </p>
              <div className="space-y-1.5">
                {receiptVehicles.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2.5 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-6 rounded bg-muted flex items-center justify-center shrink-0">
                        <IconTruck className="size-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-semibold">{v.plate}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {v.type}{v.driver && ` · ${v.driver}`}{v.helpers.length > 0 && ` · ${v.helpers.join(", ")}`}
                        </p>
                      </div>
                    </div>
                    {v.rate > 0 && (
                      <span className="text-sm font-bold tabular-nums shrink-0">
                        ₱{v.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {confirmationBreakdown === undefined ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 py-1">
                  <IconLoader2 className="size-3.5 animate-spin" />
                  Loading charges...
                </div>
              ) : confirmationBreakdown !== null && ((confirmationBreakdown.charges?.length ?? 0) > 0 || (confirmationBreakdown.taxes?.length ?? 0) > 0) ? (
                <div className="space-y-1.5">
                  {(confirmationBreakdown.charges ?? []).filter((c) => c.amount !== 0).map((c, i) => (
                    <div key={i} className="flex justify-between text-sm px-1">
                      <span className="text-muted-foreground">{c.description}</span>
                      <span className="tabular-nums font-medium">₱{c.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  {(confirmationBreakdown.taxes ?? []).filter((t) => t.amount !== 0).map((t, i) => (
                    <div key={i} className="flex justify-between text-sm px-1">
                      <span className="text-muted-foreground">{t.description}</span>
                      <span className="tabular-nums font-medium">₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-primary/5 rounded-lg border border-primary/20 px-3 py-2.5 mt-1">
                    <span className="text-sm font-semibold text-primary">Total</span>
                    <span className="text-base font-bold tabular-nums text-primary">
                      ₱{(
                        (confirmationBreakdown.base_fare ?? 0) +
                        (confirmationBreakdown.charges_total ?? 0) +
                        (confirmationBreakdown.taxes_total ?? 0)
                      ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : hasRates ? (
                <div className="flex items-center justify-between bg-primary/5 rounded-lg border border-primary/20 px-3 py-2.5">
                  <span className="text-sm font-semibold text-primary">Total</span>
                  <span className="text-base font-bold tabular-nums text-primary">
                    ₱{receiptTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Pending notice */}
            {isRequested && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Present reference <strong>{bookingResult.reference_no}</strong> to the shipping line for payment confirmation. Your booking will be confirmed once payment is verified.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStepDirection("forward");
                  setBookingResult(null);
                  setConfirmationBreakdown(undefined);
                  setShowThermalReceipt(false);
                  setSelectedRoute(null);
                  setSelectedTrip(null);
                  setVehicleEntries([]);
                  setPaymentMethod("cash");
                  setRemarks("");
                  setCurrentStep("route");
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                New Booking
              </button>
              <button
                type="button"
                title="Print official thermal receipt (same as TMS)"
                onClick={() => {
                  if (bookingResult?.id) setShowThermalReceipt(true);
                }}
                disabled={!bookingResult?.id}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <IconPrinter className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/bookings")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <IconReceipt className="size-4" />
                View Bookings
              </button>
            </div>
          </div>
        </div>

        {showThermalReceipt && bookingResult?.id && (
          <ReceiptPrintView
            bookingId={bookingResult.id}
            onClose={() => setShowThermalReceipt(false)}
          />
        )}
      </div>
    );
  }

  const stepRef = useGsapStepTransition<HTMLDivElement>(currentStep, stepDirection);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleExitBooking}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Back to bookings"
        >
          <IconArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Create Booking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Book vehicles on your assigned routes
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-6">
        <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />
      </div>

      {/* Step Content */}
      <div ref={stepRef}>
        {currentStep === "route" && (
          <div>
            <RouteSelector
              routes={routes}
              isLoading={isLoadingData}
              onSelect={handleRouteSelect}
            />
          </div>
        )}

        {currentStep === "trip" && selectedRoute && (
          <div>
            <TripSelector
              route={selectedRoute}
              onSelect={handleTripSelect}
              onBack={handleBackToRoute}
            />
          </div>
        )}

        {currentStep === "vehicles" && selectedRoute && selectedTrip && (
          <div>
            <VehicleForm
              route={selectedRoute}
              trip={selectedTrip}
              vehicles={vehicles}
              personnel={personnel}
              vehicleTypes={vehicleTypes}
              cabins={tripCabins}
              isLoadingCabins={isLoadingCabins}
              entries={vehicleEntries}
              onEntriesChange={setVehicleEntries}
              onUpdateVehicleType={handleUpdateVehicleType}
              onBack={handleBackToTrip}
            />
            {/* Continue button */}
            {vehicleEntries.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleVehiclesDone}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Continue to Review
                  <IconArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === "review" && selectedRoute && selectedTrip && (
          <div>
            <BookingReview
              route={selectedRoute}
              trip={selectedTrip}
              vehicleEntries={vehicleEntries}
              paymentMethod={paymentMethod}
              remarks={remarks}
              onPaymentMethodChange={setPaymentMethod}
              onRemarksChange={setRemarks}
              onSubmit={handleSubmit}
              onBack={handleBackToVehicles}
              isSubmitting={isSubmitting}
              creditBalance={creditBalance}
            />
          </div>
        )}
      </div>
    </div>
  );
}
