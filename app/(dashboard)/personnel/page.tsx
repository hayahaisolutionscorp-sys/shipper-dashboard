"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { differenceInYears } from "date-fns";
import {
  IconUsers,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconX,
  IconPencil,
  IconSearch
} from "@tabler/icons-react";
import { authService, type Personnel, type Vehicle } from "@/services/auth.service";
import { listVariants, itemVariants } from "@/components/motion/page-transition";
import { PersonnelTableSkeleton } from "@/components/ui/skeletons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { logActivity } from "@/lib/activity-logger";

type RoleFilter = "all" | "driver" | "helper";

export default function PersonnelPage() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Personnel | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "driver" as "driver" | "helper",
    sex: null as "male" | "female" | null,
    date_of_birth: null as string | null,
  });

  const { data: personnel = [], isPending: isLoading } = useQuery({
    queryKey: ["my-personnel"],
    queryFn: async () => {
      try {
        return await authService.getPersonnel();
      } catch (error) {
        toast.error("Failed to fetch personnel list");
        return [];
      }
    }
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["my-vehicles"],
    queryFn: async () => {
      try {
        return await authService.getVehicles();
      } catch {
        return [];
      }
    },
  });

  // Build a map: personnel id → assigned vehicle plate
  const assignedVehicleMap = new Map<string, string>();
  for (const v of vehicles) {
    if (v.driver?.id) assignedVehicleMap.set(v.driver.id, v.plate_number);
    if (v.helper?.id) assignedVehicleMap.set(v.helper.id, v.plate_number);
  }

  function openAddModal() {
    setEditingPerson(null);
    setFormData({
      name: "",
      phone: "",
      role: "driver",
      sex: null,
      date_of_birth: null,
    });
    setShowModal(true);
  }

  function openEditModal(person: Personnel) {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      phone: person.phone || "",
      role: person.role,
      sex: person.sex ?? null,
      date_of_birth: person.date_of_birth ?? null,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPerson(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    const isEdit = !!editingPerson;

    try {
      if (isEdit) {
        await authService.updatePersonnel(editingPerson!.id, {
          name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
          sex: formData.sex,
          date_of_birth: formData.date_of_birth ?? undefined,
        } as Partial<Personnel>);
        logActivity("personnel", "Personnel Updated", `${formData.name} · ${formData.role}`);
      } else {
        await authService.createPersonnel({
          name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
          sex: formData.sex,
          date_of_birth: formData.date_of_birth ?? undefined,
        });
        logActivity("personnel", "Personnel Added", `${formData.name} · ${formData.role}`);
      }

      toast.success(isEdit ? "Personnel updated successfully" : "Personnel added successfully");
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["my-personnel"] });
    } catch (error: any) {
      console.error("Failed to save personnel", error);
      toast.error(isEdit ? "Failed to update personnel" : "Failed to add personnel", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeletePerson() {
    if (!pendingDelete) return;
    const person = pendingDelete;
    setPendingDelete(null);

    setActionLoadingId(person.id);
    const promise = authService.deletePersonnel(person.id);

    toast.promise(promise, {
      loading: "Removing personnel...",
      success: "Personnel removed successfully",
      error: (err) => `Failed to remove personnel: ${err.message}`,
    });

    try {
      await promise;
      logActivity("personnel", "Personnel Removed", `${person.name} · ${person.role}`);
      await queryClient.invalidateQueries({ queryKey: ["my-personnel"] });
    } catch {
      // error toast already shown
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleToggleActive(person: Personnel) {
    const newStatus = !person.is_active;

    const promise = authService.updatePersonnel(person.id, {
      is_active: newStatus,
    } as Partial<Personnel>);

    toast.promise(promise, {
      loading: newStatus ? "Activating personnel..." : "Deactivating personnel...",
      success: `Personnel ${newStatus ? "activated" : "deactivated"}`,
      error: (err: any) => `Failed to update status: ${err.message}`,
    });

    try {
      await promise;
      await queryClient.invalidateQueries({ queryKey: ["my-personnel"] });
    } catch {
      // error toast already shown
    }
  }

  const filteredPersonnel = personnel.filter((p) => {
    const matchesRole = roleFilter === "all" ? true : p.role === roleFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone?.includes(searchQuery) ?? false);
    return matchesRole && matchesSearch;
  });

  const tabs: { value: RoleFilter; label: string }[] = [
    { value: "all", label: `All (${personnel.length})` },
    { value: "driver", label: `Drivers (${personnel.filter((p) => p.role === "driver").length})` },
    { value: "helper", label: `Helpers (${personnel.filter((p) => p.role === "helper").length})` },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Personnel Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage drivers and helpers for your fleet</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <IconPlus className="size-4" />
          Add Personnel
        </button>
      </div>

      {!isLoading && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden bg-background shadow-sm p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${roleFilter === tab.value
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm transition-shadow"
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove Personnel"
        description={pendingDelete ? `Are you sure you want to remove ${pendingDelete.name}? This action cannot be undone.` : ""}
        confirmLabel="Remove"
        isLoading={!!actionLoadingId}
        onConfirm={confirmDeletePerson}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-lg z-10"
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
            >
              <IconX className="size-4" />
            </button>
            <h2 className="text-xl font-semibold mb-6 tracking-tight">
              {editingPerson ? "Edit Personnel" : "Add New Personnel"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 09XX XXX XXXX"
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Sex (Optional)
                </label>
                <select
                  value={formData.sex ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({
                      ...formData,
                      sex: (v === "male" || v === "female" ? v : null) as
                        | "male"
                        | "female"
                        | null,
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                >
                  <option value="">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date_of_birth: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Role Assignment</label>
                <div className="grid grid-cols-2 gap-4">
                  {["driver", "helper"].map((role) => (
                    <label
                      key={role}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.role === role
                        ? "bg-primary/5 border-primary ring-1 ring-primary"
                        : "bg-background border-border hover:border-primary/50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={formData.role === role}
                        onChange={() => setFormData({ ...formData, role: role as "driver" | "helper" })}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
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
                  {isSubmitting ? "Saving..." : editingPerson ? "Save Changes" : "Create Personnel"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Floating Rows List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 overflow-hidden">
            <PersonnelTableSkeleton />
          </div>
        ) : filteredPersonnel.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-16 text-center flex flex-col items-center justify-center">
            <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <IconUsers className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No personnel found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery ? `No matches for "${searchQuery}"` : "Add drivers and helpers to manage your fleet operations."}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Add personnel
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px] flex flex-col gap-3">
              {/* List Header */}
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_100px] gap-4 px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Name & Contact</div>
                <div>Role</div>
                <div>Status</div>
                <div>Assigned Vehicle</div>
                <div className="text-right">Actions</div>
              </div>
              {/* List Body */}
              <motion.div
                key={roleFilter}
                variants={listVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
                className="flex flex-col gap-3"
              >
                {filteredPersonnel.map((person) => (
                  <motion.div
                    key={person.id}
                    variants={itemVariants}
                    className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:border-border transition-all duration-300 grid grid-cols-[1.5fr_1fr_1fr_1fr_100px] gap-4 px-6 py-4 items-center group relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border/50">
                        <span className="font-semibold text-xs">{person.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{person.name}</p>
                        {person.phone ? (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{person.phone}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground/50 italic mt-0.5">No contact info</p>
                        )}
                        {(person.sex || person.date_of_birth) && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {person.sex ? person.sex : "—"}
                            {person.date_of_birth ? ` · ${differenceInYears(new Date(), new Date(person.date_of_birth))} yrs old` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${person.role === "driver"
                          ? "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                          : "bg-purple-100/50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                          }`}
                      >
                        {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Active/Inactive Toggle */}
                      <button
                        onClick={() => handleToggleActive(person)}
                        disabled={!!actionLoadingId}
                        className="group/toggle flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title={person.is_active ? "Deactivate account" : "Activate account"}
                      >
                        <div
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 border border-transparent ${person.is_active
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/40"
                            }`}
                        >
                          <span
                            className={`inline-block size-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${person.is_active ? "translate-x-[18px]" : "translate-x-[3px]"
                              }`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium w-16">
                          {person.is_active ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </div>

                    {/* Assigned Vehicle */}
                    <div>
                      {assignedVehicleMap.has(person.id) ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-muted/50 text-foreground border border-border/50">
                          {assignedVehicleMap.get(person.id)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">Unassigned</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(person)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit details"
                        disabled={!!actionLoadingId}
                      >
                        <IconPencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(person)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remove personnel"
                        disabled={!!actionLoadingId}
                      >
                        {actionLoadingId === person.id ? (
                          <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                          <IconTrash className="size-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
