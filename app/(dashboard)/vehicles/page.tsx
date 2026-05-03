"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconCar,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconX,
  IconSearch,
  IconPencil,
  IconSteeringWheel,
  IconTool,
  IconChevronDown,
  IconCheck,
  IconUserPlus,
} from "@tabler/icons-react";
import { authService, type Vehicle, type Personnel, type VehicleType } from "@/services/auth.service";
import { useGsapPresence, useGsapStagger, useGsapDropdownPresence } from "@/lib/gsap-animations";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonnelSelector } from "@/components/ui/personnel-selector";
import { VehiclesTableSkeleton } from "@/components/ui/skeletons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { logActivity } from "@/lib/activity-logger";

// ─── Inline personnel picker for use inside the modal ───────────────────────
// Does NOT use a portal — renders relative to its container inside the form.
function InlinePersonnelPicker({
  personnel,
  role,
  selectedId,
  onSelect,
  onClear,
}: {
  personnel: Personnel[];
  role: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { mounted, dropdownRef } = useGsapDropdownPresence(isOpen);

  const selected = personnel.find((p) => p.id === selectedId) ?? null;

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen, close]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow hover:border-ring/40"
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20 shrink-0">
              {selected.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground truncate">{selected.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground flex items-center gap-1.5">
            <IconUserPlus className="size-4" />
            Select {role}
          </span>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onClear(); }
              }}
              className="p-0.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <IconX className="size-3" />
            </span>
          )}
          <IconChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {mounted && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-[200] overflow-hidden"
        >
          <div className="max-h-48 overflow-y-auto p-1">
            {personnel.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-4">
                No {role.toLowerCase()} available
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { onClear(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left text-xs text-muted-foreground italic"
                >
                  None (unassigned)
                </button>
                {personnel.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onSelect(p.id); setIsOpen(false); }}
                    disabled={p.id === selectedId}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20 shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      {p.phone && (
                        <p className="text-[11px] text-muted-foreground truncate">{p.phone}</p>
                      )}
                    </div>
                    {p.id === selectedId && (
                      <IconCheck className="size-3 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status radio cards ──────────────────────────────────────────────────────
const STATUS_CARDS = [
  { value: "active", label: "Active", dot: "bg-emerald-500" },
  { value: "maintenance", label: "Maintenance", dot: "bg-amber-500" },
  { value: "retired", label: "Retired", dot: "bg-gray-400" },
];

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<{
    plate_number: string;
    vehicle_type: string;
    vehicle_type_id: number | "";
    status: string;
    driver_id: string | null;
    helper_id: string | null;
  }>({
    plate_number: "",
    vehicle_type: "",
    vehicle_type_id: "",
    status: "active",
    driver_id: null,
    helper_id: null,
  });

  const { data: vehicles = [], isPending: vehiclesLoading } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: async () => {
      try {
        return await authService.getVehicles();
      } catch (error) {
        toast.error("Failed to load vehicles");
        return [];
      }
    },
  });

  const { data: personnel = [], isPending: personnelLoading } = useQuery({
    queryKey: ["my-personnel"],
    queryFn: async () => {
      try {
        return await authService.getPersonnel();
      } catch {
        return [];
      }
    },
  });

  const { data: vehicleTypes = [], isPending: vehicleTypesLoading } = useQuery({
    queryKey: ["my-vehicle-types"],
    queryFn: async () => {
      try {
        return await authService.getVehicleTypes();
      } catch {
        return [];
      }
    },
  });

  const isLoading = vehiclesLoading || personnelLoading || vehicleTypesLoading;

  function openAddModal() {
    setEditingVehicle(null);
    setFormData({
      plate_number: "",
      vehicle_type: "",
      vehicle_type_id: "",
      status: "active",
      driver_id: null,
      helper_id: null,
    });
    setShowModal(true);
  }

  function openEditModal(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setFormData({
      plate_number: vehicle.plate_number,
      vehicle_type: vehicle.vehicle_type,
      vehicle_type_id: vehicle.vehicle_type_id ?? "",
      status: vehicle.status ?? "active",
      driver_id: vehicle.driver?.id ?? null,
      helper_id: vehicle.helper?.id ?? null,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingVehicle(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.plate_number || !formData.vehicle_type) return;

    setIsSubmitting(true);
    const isEdit = !!editingVehicle;

    try {
      const vehiclePayload = {
        plate_number: formData.plate_number,
        vehicle_type: formData.vehicle_type,
        vehicle_type_id: formData.vehicle_type_id !== "" ? formData.vehicle_type_id : undefined,
        status: formData.status,
      };

      if (isEdit) {
        await authService.updateVehicle(editingVehicle!.id, vehiclePayload);

        // Driver changes
        const oldDriverId = editingVehicle!.driver?.id ?? null;
        if (formData.driver_id !== oldDriverId) {
          if (formData.driver_id) {
            await authService.assignDriver(editingVehicle!.id, formData.driver_id);
          } else if (oldDriverId) {
            await authService.removeDriver(editingVehicle!.id);
          }
        }

        // Helper changes
        const oldHelperId = editingVehicle!.helper?.id ?? null;
        if (formData.helper_id !== oldHelperId) {
          if (formData.helper_id) {
            await authService.assignHelper(editingVehicle!.id, formData.helper_id);
          } else if (oldHelperId) {
            await authService.removeHelper(editingVehicle!.id);
          }
        }

        logActivity("vehicle", "Vehicle Updated", `${vehiclePayload.plate_number} · ${vehiclePayload.vehicle_type}`);
      } else {
        const created = await authService.createVehicle(vehiclePayload);

        if (created?.id) {
          if (formData.driver_id) await authService.assignDriver(created.id, formData.driver_id);
          if (formData.helper_id) await authService.assignHelper(created.id, formData.helper_id);
        }

        logActivity("vehicle", "Vehicle Added", `${vehiclePayload.plate_number} · ${vehiclePayload.vehicle_type}`);
      }

      toast.success(isEdit ? "Vehicle updated successfully" : "Vehicle added successfully");
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    } catch (error: any) {
      toast.error(isEdit ? "Failed to update vehicle" : "Failed to add vehicle", {
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeleteVehicle() {
    if (!pendingDelete) return;
    const vehicle = pendingDelete;
    setPendingDelete(null);

    setActionLoadingId(vehicle.id);
    const promise = authService.deleteVehicle(vehicle.id);

    toast.promise(promise, {
      loading: "Deleting vehicle...",
      success: "Vehicle deleted successfully",
      error: (err) => `Failed to delete vehicle: ${err.message}`,
    });

    try {
      await promise;
      logActivity("vehicle", "Vehicle Removed", `${vehicle.plate_number} · ${vehicle.vehicle_type}`);
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    } catch {
      // error toast already shown
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAssign(vehicleId: string, personnelId: string, role: "driver" | "helper") {
    const loadingKey = `${vehicleId}-${role}`;
    setActionLoadingId(loadingKey);

    const promise = role === "driver"
      ? authService.assignDriver(vehicleId, personnelId)
      : authService.assignHelper(vehicleId, personnelId);

    toast.promise(promise, {
      loading: `Assigning ${role}...`,
      success: `${role.charAt(0).toUpperCase() + role.slice(1)} assigned successfully`,
      error: (err) => `Failed to assign ${role}: ${err.message}`,
    });

    try {
      await promise;
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    } catch {
      // error toast already shown
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleUnassign(vehicleId: string, role: "driver" | "helper") {
    const loadingKey = `${vehicleId}-${role}-remove`;
    setActionLoadingId(loadingKey);

    const promise = role === "driver"
      ? authService.removeDriver(vehicleId)
      : authService.removeHelper(vehicleId);

    toast.promise(promise, {
      loading: `Removing ${role}...`,
      success: `${role.charAt(0).toUpperCase() + role.slice(1)} removed successfully`,
      error: (err) => `Failed to remove ${role}: ${err.message}`,
    });

    try {
      await promise;
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    } catch {
      // error toast already shown
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleStatusChange(vehicleId: string, newStatus: string) {
    const loadingKey = `${vehicleId}-status`;
    setActionLoadingId(loadingKey);

    const promise = authService.updateVehicle(vehicleId, { status: newStatus });

    toast.promise(promise, {
      loading: "Updating status...",
      success: "Vehicle status updated",
      error: (err) => `Failed to update status: ${err.message}`,
    });

    try {
      await promise;
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    } catch {
      // error toast already shown
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicle_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const drivers = personnel.filter((p) => p.role === "driver" && p.is_active);
  const helpers = personnel.filter((p) => p.role === "helper" && p.is_active);

  const { mounted: isModalMounted, overlayRef: modalOverlayRef, panelRef: modalPanelRef } = useGsapPresence(showModal);
  const listRef = useGsapStagger<HTMLDivElement>([searchQuery, filteredVehicles]);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your vehicles and assigned personnel</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <IconPlus className="size-4" />
          Add Vehicle
        </button>
      </div>

      {/* Fleet Summary Bar */}
      {!isLoading && vehicles.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "Active", value: vehicles.filter((v) => v.status === "active").length, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
            { label: "Inactive", value: vehicles.filter((v) => v.status !== "active").length, color: "text-muted-foreground bg-muted/50 border-border" },
            { label: "No Driver", value: vehicles.filter((v) => !v.driver).length, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
            { label: "No Helper", value: vehicles.filter((v) => !v.helper).length, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${color}`}>
              <span className="tabular-nums font-bold">{value}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by plate number or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm transition-shadow"
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete Vehicle"
        description={pendingDelete ? `Are you sure you want to delete ${pendingDelete.plate_number}? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        isLoading={!!actionLoadingId}
        onConfirm={confirmDeleteVehicle}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Add/Edit Modal */}
      {isModalMounted && (
        <OverlayPortal>
          <div className="fixed inset-0 z-50 h-dvh">
            <div
              ref={modalOverlayRef}
              className="absolute inset-0 h-dvh bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                ref={modalPanelRef}
                className="relative bg-card rounded-2xl border border-border w-full max-w-md shadow-lg z-10"
              >
                <div className="p-6 pb-0">
                  <button
                    onClick={closeModal}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <IconX className="size-4" />
                  </button>
                  <h2 className="text-xl font-semibold mb-1 tracking-tight">
                    {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {editingVehicle
                      ? "Update vehicle details, status, and personnel assignments."
                      : "Fill in the vehicle details and optionally assign personnel."}
                  </p>
                </div>

                <div className="px-6 pb-6 max-h-[80dvh] overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Plate Number */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Plate Number</label>
                      <input
                        type="text"
                        value={formData.plate_number}
                        onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                        placeholder="ABC 1234"
                        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow font-mono"
                        required
                      />
                    </div>

                    {/* Vehicle Type */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Vehicle Type</label>
                      <div className="relative">
                        <select
                          value={formData.vehicle_type_id}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            const vt = vehicleTypes.find((t) => t.id === id);
                            setFormData({ ...formData, vehicle_type_id: id || "", vehicle_type: vt?.name ?? "" });
                          }}
                          className="w-full appearance-none px-3 py-2.5 pr-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                          required
                        >
                          <option value="">Select type</option>
                          {vehicleTypes.map((type) => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                        <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Status</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {STATUS_CARDS.map((s) => (
                          <label
                            key={s.value}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                              formData.status === s.value
                                ? "bg-primary/5 border-primary ring-1 ring-primary"
                                : "bg-background border-border hover:border-primary/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="vehicle-status"
                              value={s.value}
                              checked={formData.status === s.value}
                              onChange={() => setFormData({ ...formData, status: s.value })}
                              className="sr-only"
                            />
                            <span className={`size-2.5 rounded-full ${s.dot}`} />
                            <span className="text-xs font-medium capitalize">{s.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Driver */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <IconSteeringWheel className="size-4 text-muted-foreground" />
                        Driver
                        <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <InlinePersonnelPicker
                        personnel={drivers}
                        role="driver"
                        selectedId={formData.driver_id}
                        onSelect={(id) => setFormData({ ...formData, driver_id: id })}
                        onClear={() => setFormData({ ...formData, driver_id: null })}
                      />
                    </div>

                    {/* Helper */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <IconTool className="size-4 text-muted-foreground" />
                        Helper
                        <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <InlinePersonnelPicker
                        personnel={helpers}
                        role="helper"
                        selectedId={formData.helper_id}
                        onSelect={(id) => setFormData({ ...formData, helper_id: id })}
                        onClear={() => setFormData({ ...formData, helper_id: null })}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting && <IconLoader2 className="size-4 animate-spin" />}
                        {isSubmitting ? "Saving..." : editingVehicle ? "Save Changes" : "Create Vehicle"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </OverlayPortal>
      )}

      {/* Floating Rows List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 overflow-hidden">
            <VehiclesTableSkeleton />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-16 text-center flex flex-col items-center justify-center">
            <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <IconCar className="size-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No vehicles found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery ? `No vehicles matching "${searchQuery}"` : "Get started by adding your first vehicle to the fleet."}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <IconPlus className="size-4" />
                Add Vehicle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1000px] flex flex-col gap-3">
              {/* List Header */}
              <div className="grid grid-cols-[1.5fr_1.5fr_2fr_2fr_120px_100px] gap-4 px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Plate Details</div>
                <div>Type</div>
                <div className="flex items-center gap-1.5">
                  <IconSteeringWheel className="size-3.5" />
                  Assigned Driver
                </div>
                <div className="flex items-center gap-1.5">
                  <IconTool className="size-3.5" />
                  Assigned Helper
                </div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>

              {/* List Body */}
              <div ref={listRef} className="flex flex-col gap-3">
                {filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:border-border transition-all duration-300 grid grid-cols-[1.5fr_1.5fr_2fr_2fr_120px_100px] gap-4 px-6 py-4 items-center group relative"
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center border border-border/50 group-hover:bg-background transition-colors">
                        <IconCar className="size-5 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-semibold font-mono text-foreground">{vehicle.plate_number}</span>
                    </div>

                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground w-fit border border-border/50">
                      {vehicle.vehicle_type}
                    </span>

                    <PersonnelSelector
                      personnel={drivers}
                      role="Drivers"
                      assignedId={vehicle.driver?.id}
                      onSelect={(id) => handleAssign(vehicle.id, id, "driver")}
                      onRemove={() => handleUnassign(vehicle.id, "driver")}
                      isLoading={actionLoadingId === `${vehicle.id}-driver` || actionLoadingId === `${vehicle.id}-driver-remove`}
                    />

                    <PersonnelSelector
                      personnel={helpers}
                      role="Helpers"
                      assignedId={vehicle.helper?.id}
                      onSelect={(id) => handleAssign(vehicle.id, id, "helper")}
                      onRemove={() => handleUnassign(vehicle.id, "helper")}
                      isLoading={actionLoadingId === `${vehicle.id}-helper` || actionLoadingId === `${vehicle.id}-helper-remove`}
                    />

                    <div className="flex justify-center">
                      <StatusBadge
                        status={vehicle.status}
                        onChange={(status) => handleStatusChange(vehicle.id, status)}
                        isLoading={actionLoadingId === `${vehicle.id}-status`}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(vehicle)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit details"
                        disabled={!!actionLoadingId}
                      >
                        <IconPencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(vehicle)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete vehicle"
                        disabled={!!actionLoadingId}
                      >
                        <IconTrash className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
