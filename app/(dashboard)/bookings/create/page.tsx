"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { stepVariants } from "@/components/motion/page-transition";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconClock,
  IconReceipt,
  IconCalendarEvent,
  IconRoute,
  IconShip,
  IconBuilding,
  IconTruck,
} from "@tabler/icons-react";
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
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);

  // Success state
  const [bookingResult, setBookingResult] = useState<{
    reference_no: string;
    booking_status: string;
    vehicleCount: number;
  } | null>(null);

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
    setSelectedRoute(route);
    setSelectedTrip(null);
    setVehicleEntries([]);
    setCurrentStep("trip");
  }, []);

  const handleTripSelect = useCallback((trip: TripResult) => {
    setSelectedTrip(trip);
    setVehicleEntries([]);
    setCurrentStep("vehicles");
  }, []);

  const handleVehiclesDone = useCallback(() => {
    if (vehicleEntries.length === 0) {
      toast.error("Please add at least one vehicle");
      return;
    }
    setCurrentStep("review");
  }, [vehicleEntries]);

  const handleBackToRoute = useCallback(() => {
    setSelectedRoute(null);
    setSelectedTrip(null);
    setVehicleEntries([]);
    setCurrentStep("route");
  }, []);

  const handleBackToTrip = useCallback(() => {
    setSelectedTrip(null);
    setVehicleEntries([]);
    setCurrentStep("trip");
  }, []);

  const handleBackToVehicles = useCallback(() => {
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
        vehicles: vehicleEntries.map((entry) => ({
          vehicle_id: entry.vehicle.id,
          plate_number: entry.vehicle.plate_number,
          vehicle_type: entry.vehicle_type_override ?? entry.vehicle.vehicle_type,
          vehicle_type_id: entry.vehicle_type_id_override ?? entry.vehicle.vehicle_type_id ?? undefined,
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
        })),
        payment_method: paymentMethod,
        remarks: remarks || undefined,
      };

      const result = await authService.createBooking(payload);

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
        reference_no: refNo,
        booking_status: status || (paymentMethod === "collect" ? "Requested" : "Confirmed"),
        vehicleCount: vehicleEntries.length,
      });
    } catch (error: any) {
      console.error("Failed to create booking:", error);
      toast.error("Failed to create booking", {
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRoute, selectedTrip, vehicleEntries, paymentMethod, remarks]);

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

    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
        >
          {/* Top color band */}
          <div className={`h-2 ${isRequested ? "bg-linear-to-r from-amber-400 via-orange-400 to-amber-400" : "bg-linear-to-r from-emerald-400 via-teal-400 to-emerald-400"}`} />

          <div className="px-6 py-7 space-y-6">
            {/* Status icon & title */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 350, damping: 22 }}
              className="text-center space-y-3"
            >
              <div className={`size-16 rounded-full mx-auto flex items-center justify-center ring-4 ${
                isRequested
                  ? "bg-amber-100 dark:bg-amber-900/30 ring-amber-100 dark:ring-amber-900/20"
                  : "bg-emerald-100 dark:bg-emerald-900/30 ring-emerald-100 dark:ring-emerald-900/20"
              }`}>
                {isRequested ? (
                  <IconClock className="size-8 text-amber-600 dark:text-amber-400" />
                ) : (
                  <IconCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {isRequested ? "Booking Reserved" : "Booking Confirmed"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRequested
                    ? "Pending confirmation by the shipping line."
                    : "Your booking has been successfully created."}
                </p>
              </div>
            </motion.div>

            {/* Reference number */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-muted/50 rounded-xl border border-dashed border-border p-4 text-center"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                Reference Number
              </p>
              {bookingResult.reference_no ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold text-foreground tracking-widest">
                    {bookingResult.reference_no}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy reference number"
                  >
                    <IconCopy className="size-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  To be assigned by the shipping line
                </p>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <span className={`size-2 rounded-full animate-pulse ${isRequested ? "bg-amber-500" : "bg-emerald-500"}`} />
                <span className={`text-xs font-semibold ${isRequested ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {isRequested ? "Pending Confirmation" : "Confirmed"}
                </span>
              </div>
            </motion.div>

            {/* Dashed receipt divider */}
            <div className="relative h-px -mx-6">
              <div className="absolute inset-x-0 border-t border-dashed border-border" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-background border border-border" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-background border border-border" />
            </div>

            {/* Trip details */}
            {selectedRoute && selectedTrip && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Trip Details
                </p>

                <div className="bg-muted/30 rounded-xl overflow-hidden">
                  {/* Route: From → To visualization */}
                  <div className="flex items-center gap-2 px-4 py-4 border-b border-border/50">
                    <div className="flex-1 min-w-0 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">From</p>
                      <p className="text-sm font-semibold text-foreground truncate">{selectedRoute.src_port_name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-muted-foreground/50">
                      <div className="size-1.5 rounded-full bg-current" />
                      <div className="w-6 h-px bg-current" />
                      <IconArrowRight className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">To</p>
                      <p className="text-sm font-semibold text-foreground truncate">{selectedRoute.dest_port_name}</p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-px bg-border/30">
                    <div className="flex items-start gap-2.5 bg-muted/30 px-3 py-3">
                      <IconCalendarEvent className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Departure</p>
                        <p className="text-xs font-medium text-foreground mt-0.5">
                          {formatReceiptDate(selectedTrip.departure_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatReceiptTime(selectedTrip.departure_date, selectedTrip.departure_time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 bg-muted/30 px-3 py-3">
                      <IconRoute className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Route</p>
                        <p className="text-xs font-mono font-semibold text-foreground mt-0.5">{selectedRoute.route_code}</p>
                      </div>
                    </div>

                    {selectedTrip.vessel_name && (
                      <div className="flex items-start gap-2.5 bg-muted/30 px-3 py-3">
                        <IconShip className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vessel</p>
                          <p className="text-xs font-medium text-foreground mt-0.5 truncate">{selectedTrip.vessel_name}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5 bg-muted/30 px-3 py-3">
                      <IconBuilding className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Shipping Line</p>
                        <p className="text-xs font-medium text-foreground mt-0.5 truncate">{selectedRoute.tenant_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Dashed receipt divider */}
            <div className="relative h-px -mx-6">
              <div className="absolute inset-x-0 border-t border-dashed border-border" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-background border border-border" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-background border border-border" />
            </div>

            {/* Vehicles breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-2.5"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Vehicles ({bookingResult.vehicleCount})
              </p>
              <div className="space-y-2">
                {receiptVehicles.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <IconTruck className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-semibold text-foreground">{v.plate}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {v.type}
                          {v.driver && ` · ${v.driver}`}
                          {v.helpers.length > 0 && ` · ${v.helpers.join(", ")}`}
                        </p>
                      </div>
                    </div>
                    {v.rate > 0 && (
                      <span className="text-sm font-bold tabular-nums text-foreground shrink-0">
                        ₱{v.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Total */}
            {hasRates && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between bg-primary/5 rounded-xl border border-primary/20 px-4 py-3"
              >
                <span className="text-sm font-semibold text-primary">Total</span>
                <span className="text-xl font-bold tabular-nums text-primary">
                  ₱{receiptTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </motion.div>
            )}

            {/* Pending notice */}
            {isRequested && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
              >
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Present the reference number <strong>{bookingResult.reference_no}</strong> to the shipping line for payment confirmation.
                  Your booking will be confirmed once payment is verified through the TMS.
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setBookingResult(null);
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
                onClick={() => router.push("/bookings")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <IconReceipt className="size-4" />
                View Bookings
              </button>
            </div>
          </div>

          {/* Bottom color band */}
          <div className={`h-1.5 ${isRequested ? "bg-linear-to-r from-amber-400 via-orange-400 to-amber-400" : "bg-linear-to-r from-emerald-400 via-teal-400 to-emerald-400"}`} />
        </motion.div>
      </div>
    );
  }

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

      {/* Step Content - initial={false} avoids double animation on first load */}
      <AnimatePresence mode="wait" initial={false}>
        {currentStep === "route" && (
          <motion.div
            key="route"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <RouteSelector
              routes={routes}
              isLoading={isLoadingData}
              onSelect={handleRouteSelect}
            />
          </motion.div>
        )}

        {currentStep === "trip" && selectedRoute && (
          <motion.div
            key="trip"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <TripSelector
              route={selectedRoute}
              onSelect={handleTripSelect}
              onBack={handleBackToRoute}
            />
          </motion.div>
        )}

        {currentStep === "vehicles" && selectedRoute && selectedTrip && (
          <motion.div
            key="vehicles"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <VehicleForm
              route={selectedRoute}
              trip={selectedTrip}
              vehicles={vehicles}
              personnel={personnel}
              vehicleTypes={vehicleTypes}
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
          </motion.div>
        )}

        {currentStep === "review" && selectedRoute && selectedTrip && (
          <motion.div
            key="review"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
