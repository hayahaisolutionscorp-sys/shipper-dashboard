"use client";

import { useState } from "react";
import { useGsapCardEntrance } from "@/lib/gsap-animations";
import {
  IconCar,
  IconTag,
  IconTrash,
  IconUser,
  IconUsers,
  IconChevronDown,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type { Vehicle, Personnel, VehicleType, TripCabin } from "@/services/auth.service";
import type { BookingVehicleEntry } from "@/types/booking";

interface VehicleCardProps {
  entry: BookingVehicleEntry;
  index: number;
  personnel: Personnel[];
  vehicleTypes: VehicleType[];
  cabins: TripCabin[];
  isLoadingCabins: boolean;
  onUpdateDriver: (driver: Personnel | null) => void;
  onAddHelper: () => void;
  onUpdateHelper: (helperIndex: number, person: Personnel) => void;
  onRemoveHelper: (helperIndex: number) => void;
  onUpdateVehicleType: (typeName: string, typeId: number) => void;
  onUpdatePersonnelCabin: (cabin: TripCabin | null) => void;
  onRemove: () => void;
}

export function VehicleCard({
  entry,
  index,
  personnel,
  vehicleTypes,
  cabins,
  isLoadingCabins,
  onUpdateDriver,
  onAddHelper,
  onUpdateHelper,
  onRemoveHelper,
  onUpdateVehicleType,
  onUpdatePersonnelCabin,
  onRemove,
}: VehicleCardProps) {
  const drivers = personnel.filter((p) => p.role === "driver" && p.is_active);
  const helpers = personnel.filter((p) => p.role === "helper" && p.is_active);
  const selectedCabin =
    entry.personnel_cabin_id != null
      ? cabins.find((c) => c.id === entry.personnel_cabin_id) ?? null
      : null;
  const cardRef = useGsapCardEntrance<HTMLDivElement>([entry.vehicle.id], { y: 8, delay: index * 0.02 });

  return (
    <div
      ref={cardRef}
      data-vehicle-card-id={entry.vehicle.id}
      className="bg-card rounded-xl border border-border p-4 space-y-3 will-change-transform"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center border border-border/50">
            <IconCar className="size-4 text-muted-foreground" />
          </div>
          <div>
            <span className="text-sm font-mono font-semibold text-foreground">
              {entry.vehicle.plate_number}
            </span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
              {entry.vehicle.vehicle_type}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Remove vehicle"
        >
          <IconTrash className="size-4" />
        </button>
      </div>

      {/* Vehicle Type */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <IconTag className="size-3" />
          Vehicle Type
          {!entry.vehicle_type_override && (
            <span className="ml-1 flex items-center gap-0.5 text-amber-500">
              <IconAlertTriangle className="size-3" />
              <span className="text-[10px]">confirm type</span>
            </span>
          )}
        </label>
        <VehicleTypeDropdown
          options={vehicleTypes}
          currentValue={entry.vehicle_type_override ?? entry.vehicle.vehicle_type}
          hasOverride={!!entry.vehicle_type_override}
          onSelect={onUpdateVehicleType}
        />
      </div>

      {/* Driver Selection */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <IconUser className="size-3" />
          Driver
        </label>
        <PersonnelDropdown
          options={drivers}
          selected={entry.driver}
          onSelect={(p) => onUpdateDriver(p)}
          onClear={() => onUpdateDriver(null)}
          placeholder="Select driver..."
        />
      </div>

      {/* Personnel Cabin / Accommodation */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          Accommodation
        </label>
        <CabinDropdown
          options={cabins}
          selected={selectedCabin}
          isLoading={isLoadingCabins}
          onSelect={onUpdatePersonnelCabin}
          onClear={() => onUpdatePersonnelCabin(null)}
          placeholder={isLoadingCabins ? "Loading cabins..." : "Select cabin..."}
        />
      </div>

      {/* Helpers */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <IconUsers className="size-3" />
            Helpers ({entry.helpers.length})
          </label>
          <button
            type="button"
            onClick={onAddHelper}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            + Add helper
          </button>
        </div>
        {entry.helpers.map((helper, hIdx) => {
          const occupiedIds = new Set(
            entry.helpers.filter((_, i) => i !== hIdx).map((h) => h?.id).filter(Boolean),
          );
          const availableHelpers = helpers.filter((h) => !occupiedIds.has(h.id));
          return (
          <div key={`helper-${hIdx}`} className="flex items-center gap-2">
            <div className="flex-1">
              <PersonnelDropdown
                options={availableHelpers}
                selected={helper}
                onSelect={(p) => onUpdateHelper(hIdx, p)}
                onClear={() => onRemoveHelper(hIdx)}
                placeholder="Select helper..."
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveHelper(hIdx)}
              className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <IconTrash className="size-3.5" />
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Inline Vehicle Type Dropdown ============

interface VehicleTypeDropdownProps {
  options: VehicleType[];
  currentValue: string;
  hasOverride: boolean;
  onSelect: (typeName: string, typeId: number) => void;
}

function VehicleTypeDropdown({
  options,
  currentValue,
  hasOverride,
  onSelect,
}: VehicleTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={[
          "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors",
          hasOverride
            ? "border-border bg-card hover:bg-muted/50"
            : "border-amber-400/60 bg-amber-50/30 dark:bg-amber-900/10 hover:bg-amber-50/50 dark:hover:bg-amber-900/20",
        ].join(" ")}
      >
        <span className="flex items-center gap-2 text-foreground">
          <IconCar className="size-3.5 text-muted-foreground shrink-0" />
          {currentValue || <span className="text-muted-foreground">Select type...</span>}
          {!hasOverride && currentValue && (
            <span className="text-[10px] text-amber-500 font-medium">(unconfirmed)</span>
          )}
        </span>
        <IconChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-1 w-full bg-card rounded-lg border border-border shadow-lg max-h-48 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                No vehicle types available
              </div>
            ) : (
              options.map((vt) => (
                <button
                  key={vt.id}
                  type="button"
                  onClick={() => {
                    onSelect(vt.name, vt.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-foreground">{vt.name}</span>
                  {currentValue.toLowerCase() === vt.name.toLowerCase() && hasOverride && (
                    <IconCheck className="size-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============ Inline Personnel Dropdown ============

interface PersonnelDropdownProps {
  options: Personnel[];
  selected: Personnel | null;
  onSelect: (person: Personnel) => void;
  onClear: () => void;
  placeholder: string;
}

function PersonnelDropdown({
  options,
  selected,
  onSelect,
  onClear,
  placeholder,
}: PersonnelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card text-sm hover:bg-muted/50 transition-colors"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                {selected.name.charAt(0).toUpperCase()}
              </span>
              {selected.name}
              {selected.phone && (
                <span className="text-muted-foreground text-xs">({selected.phone})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <IconChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-1 w-full bg-card rounded-lg border border-border shadow-lg max-h-48 overflow-y-auto">
            {selected && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                Clear selection
              </button>
            )}
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                No personnel available
              </div>
            ) : (
              options.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    onSelect(person);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{person.name}</p>
                    {person.phone && (
                      <p className="text-[10px] text-muted-foreground">{person.phone}</p>
                    )}
                  </div>
                  {selected?.id === person.id && (
                    <IconCheck className="size-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============ Inline Cabin Dropdown ============

interface CabinDropdownProps {
  options: TripCabin[];
  selected: TripCabin | null;
  isLoading: boolean;
  onSelect: (cabin: TripCabin) => void;
  onClear: () => void;
  placeholder: string;
}

function CabinDropdown({
  options,
  selected,
  isLoading,
  onSelect,
  onClear,
  placeholder,
}: CabinDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.name : placeholder}
        </span>
        <IconChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-1 w-full bg-card rounded-lg border border-border shadow-lg max-h-48 overflow-y-auto">
            {selected && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                Clear selection
              </button>
            )}
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                No cabins available
              </div>
            ) : (
              options.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-foreground">{c.name}</span>
                  {selected?.id === c.id && (
                    <IconCheck className="size-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
