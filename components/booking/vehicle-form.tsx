"use client";

import { useState, useMemo, useCallback } from "react";
import gsap from "gsap";

import {
  IconSearch,
  IconCar,
  IconLoader2,
  IconAlertCircle,
  IconShip,
  IconArrowRight,
  IconClock,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { Vehicle, Personnel, AssignedRoute, VehicleType, TripCabin } from "@/services/auth.service";
import type { TripResult, BookingVehicleEntry } from "@/types/booking";
import { VehicleCard } from "./vehicle-card";

interface VehicleFormProps {
  route: AssignedRoute;
  trip: TripResult;
  vehicles: Vehicle[];
  personnel: Personnel[];
  vehicleTypes: VehicleType[];
  cabins: TripCabin[];
  isLoadingCabins: boolean;
  entries: BookingVehicleEntry[];
  onEntriesChange: (entries: BookingVehicleEntry[]) => void;
  onUpdateVehicleType: (index: number, typeName: string, typeId: number) => void;
  onBack: () => void;
}

export function VehicleForm({
  route,
  trip,
  vehicles,
  personnel,
  vehicleTypes,
  cabins,
  isLoadingCabins,
  entries,
  onEntriesChange,
  onUpdateVehicleType,
  onBack,
}: VehicleFormProps) {
  const [plateSearch, setPlateSearch] = useState("");
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const existingPlates = entries.map((e) => e.vehicle.plate_number);

  // Filter available vehicles (active + not already added)
  const availableVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        v.status === "active" &&
        !existingPlates.includes(v.plate_number)
    );
  }, [vehicles, existingPlates]);

  const filteredVehicles = useMemo(() => {
    if (!plateSearch) return availableVehicles;
    const term = plateSearch.toLowerCase();
    return availableVehicles.filter(
      (v) =>
        v.plate_number.toLowerCase().includes(term) ||
        v.vehicle_type.toLowerCase().includes(term)
    );
  }, [availableVehicles, plateSearch]);

  const handleAddVehicle = useCallback(
    (vehicle: Vehicle) => {
      // Auto-assign driver/helper from vehicle's existing assignments
      const driver = vehicle.driver
        ? personnel.find((p) => p.id === vehicle.driver!.id) || null
        : null;
      const helpers: Personnel[] = [];
      if (vehicle.helper) {
        const found = personnel.find((p) => p.id === vehicle.helper!.id);
        if (found) helpers.push(found);
      }

      // Auto-confirm vehicle type if it matches a known type from the tenant
      let vehicle_type_override: string | undefined;
      let vehicle_type_id_override: number | undefined;

      if (vehicle.vehicle_type_id) {
        const match = vehicleTypes.find((vt) => vt.id === vehicle.vehicle_type_id);
        if (match) {
          vehicle_type_override = match.name;
          vehicle_type_id_override = match.id;
        }
      }

      if (!vehicle_type_override && vehicle.vehicle_type) {
        const match = vehicleTypes.find(
          (vt) => vt.name.toLowerCase() === vehicle.vehicle_type.toLowerCase(),
        );
        if (match) {
          vehicle_type_override = match.name;
          vehicle_type_id_override = match.id;
        }
      }

      const newEntry: BookingVehicleEntry = {
        vehicle,
        driver,
        helpers,
        vehicle_type_override,
        vehicle_type_id_override,
      };
      onEntriesChange([...entries, newEntry]);
      setPlateSearch("");
      setShowVehiclePicker(false);
      toast.success(`Vehicle ${vehicle.plate_number} added`);
    },
    [entries, onEntriesChange, personnel, vehicleTypes]
  );

  const handleRemoveVehicle = useCallback(
    (index: number) => {
      const targetEntry = entries[index];
      if (!targetEntry) return;

      const selector = `[data-vehicle-card-id="${targetEntry.vehicle.id}"]`;
      const target = document.querySelector(selector);

      if (!(target instanceof HTMLElement)) {
        onEntriesChange(entries.filter((_, i) => i !== index));
        return;
      }

      gsap.to(target, {
        opacity: 0,
        y: -6,
        scale: 0.98,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => {
          onEntriesChange(entries.filter((_, i) => i !== index));
        },
      });
    },
    [entries, onEntriesChange]
  );

  const handleUpdateDriver = useCallback(
    (index: number, driver: Personnel | null) => {
      const updated = [...entries];
      updated[index] = { ...updated[index], driver };
      onEntriesChange(updated);
    },
    [entries, onEntriesChange]
  );

  const handleUpdatePersonnelCabin = useCallback(
    (index: number, cabin: TripCabin | null) => {
      const updated = [...entries];
      updated[index] = {
        ...updated[index],
        personnel_cabin_id: cabin?.id ?? null,
        personnel_cabin_name: cabin?.name ?? null,
      };
      onEntriesChange(updated);
    },
    [entries, onEntriesChange],
  );

  const handleAddHelper = useCallback(
    (index: number) => {
      const activeHelpers = personnel.filter(
        (p) => p.role === "helper" && p.is_active
      );

      // Track how many helpers are already assigned in this booking to prevent over-adding.
      let currentlyAssignedHelperCount = 0;
      for (const entry of entries) {
        currentlyAssignedHelperCount += entry.helpers.length;
      }

      if (currentlyAssignedHelperCount >= activeHelpers.length) {
        toast.error("You have no more helpers available to assign.");
        return;
      }

      if (activeHelpers.length === 0) {
        toast.error("No helpers available in your company.");
        return;
      }
      const updated = [...entries];
      updated[index] = {
        ...updated[index],
        helpers: [...updated[index].helpers, activeHelpers[currentlyAssignedHelperCount]],
      };
      onEntriesChange(updated);
    },
    [entries, onEntriesChange, personnel]
  );

  const handleUpdateHelper = useCallback(
    (vehicleIndex: number, helperIndex: number, person: Personnel) => {
      const updated = [...entries];
      const newHelpers = [...updated[vehicleIndex].helpers];
      newHelpers[helperIndex] = person;
      updated[vehicleIndex] = { ...updated[vehicleIndex], helpers: newHelpers };
      onEntriesChange(updated);
    },
    [entries, onEntriesChange]
  );

  const handleRemoveHelper = useCallback(
    (vehicleIndex: number, helperIndex: number) => {
      const updated = [...entries];
      const newHelpers = [...updated[vehicleIndex].helpers];
      newHelpers.splice(helperIndex, 1);
      updated[vehicleIndex] = { ...updated[vehicleIndex], helpers: newHelpers };
      onEntriesChange(updated);
    },
    [entries, onEntriesChange]
  );

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

  return (
    <div className="space-y-4">
      {/* Trip Info Banner */}
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
                <span className="text-xs text-muted-foreground">
                  {trip.vessel_name}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <IconClock className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatTime(trip.departure_date, trip.departure_time)}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Change trip
          </button>
        </div>
      </div>

      {/* Add Vehicle Section */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Add Vehicle from Fleet
          </h3>
          <span className="text-xs text-muted-foreground">
            {availableVehicles.length} available
          </span>
        </div>

        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by plate number or type..."
            value={plateSearch}
            onChange={(e) => {
              setPlateSearch(e.target.value.toUpperCase());
              setShowVehiclePicker(true);
            }}
            onFocus={() => setShowVehiclePicker(true)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-sm font-mono text-foreground placeholder:text-muted-foreground placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Vehicle picker dropdown */}
        {showVehiclePicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowVehiclePicker(false)} />
            <div className="relative z-40 bg-card rounded-lg border border-border shadow-lg max-h-48 overflow-y-auto">
              {filteredVehicles.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  {plateSearch
                    ? "No matching vehicles found"
                    : "No vehicles available to add"}
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => handleAddVehicle(vehicle)}
                    className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center border border-border/50">
                      <IconCar className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-mono font-medium text-foreground">
                        {vehicle.plate_number}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {vehicle.vehicle_type}
                      </span>
                    </div>
                    {vehicle.driver && (
                      <span className="text-[10px] text-muted-foreground">
                        Driver: {vehicle.driver.name}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Vehicle List */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Selected Vehicles ({entries.length})
          </h3>
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <VehicleCard
                key={entry.vehicle.id}
                entry={entry}
                index={index}
                personnel={personnel}
                vehicleTypes={vehicleTypes}
                cabins={cabins}
                isLoadingCabins={isLoadingCabins}
                onUpdateDriver={(driver) => handleUpdateDriver(index, driver)}
                onAddHelper={() => handleAddHelper(index)}
                onUpdateHelper={(hIdx, person) => handleUpdateHelper(index, hIdx, person)}
                onRemoveHelper={(hIdx) => handleRemoveHelper(index, hIdx)}
                onUpdateVehicleType={(typeName, typeId) => onUpdateVehicleType(index, typeName, typeId)}
                onUpdatePersonnelCabin={(cabin) => handleUpdatePersonnelCabin(index, cabin)}
                onRemove={() => handleRemoveVehicle(index)}
              />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="p-6 text-center bg-muted/30 rounded-xl border border-dashed border-border">
          <IconCar className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Add vehicles from your fleet to include in this booking
          </p>
        </div>
      )}
    </div>
  );
}
