"use client";

import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconUsersGroup,
  IconPlus,
  IconLoader2,
  IconX,
  IconShield,
  IconUser,
  IconPower,
  IconUserX,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { authService, type ShipperAccount } from "@/services/auth.service";
import { useGsapPresence, useGsapStagger } from "@/lib/gsap-animations";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { TeamMembersSkeleton } from "@/components/ui/skeletons";

export default function TeamPage() {
  const queryClient = useQueryClient();
  const storedData = authService.getStoredData();
  const currentAccountId = storedData?.account?.id;
  const isPrimary = storedData?.account?.is_primary ?? false;

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<ShipperAccount | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  const { data: accounts = [], isPending: isLoading } = useQuery({
    queryKey: ["team-accounts"],
    queryFn: async () => {
      try {
        return await authService.getAccounts();
      } catch {
        toast.error("Failed to load team members");
        return [] as ShipperAccount[];
      }
    },
  });

  const { mounted: isAddModalMounted, overlayRef: addModalOverlayRef, panelRef: addModalPanelRef } = useGsapPresence(showModal);
  const listRef = useGsapStagger<HTMLDivElement>([accounts]);

  function openAddModal() {
    setFormData({ email: "", password: "", first_name: "", last_name: "", phone: "" });
    setShowPassword(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsSubmitting(true);
    try {
      await authService.createAccount({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        phone: formData.phone || undefined,
      });
      toast.success("Team member added successfully");
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["team-accounts"] });
    } catch (error: any) {
      toast.error("Failed to add team member", {
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmToggleActive() {
    if (!pendingToggle) return;
    const account = pendingToggle;
    setPendingToggle(null);

    setActionLoadingId(account.id);
    const action = account.is_active ? "deactivate" : "reactivate";

    const promise = account.is_active
      ? authService.deactivateAccount(account.id)
      : authService.reactivateAccount(account.id);

    toast.promise(promise, {
      loading: `${action === "deactivate" ? "Deactivating" : "Reactivating"} account...`,
      success: `Account ${action === "deactivate" ? "deactivated" : "reactivated"} successfully`,
      error: (err) => `Failed to ${action} account: ${err.message}`,
    });

    try {
      await promise;
      await queryClient.invalidateQueries({ queryKey: ["team-accounts"] });
    } catch {
      // error toast already shown
    } finally {
      setActionLoadingId(null);
    }
  }

  const getDisplayName = (account: ShipperAccount) => {
    if (account.first_name || account.last_name) {
      return [account.first_name, account.last_name].filter(Boolean).join(" ");
    }
    return account.email;
  };

  const getInitials = (account: ShipperAccount) => {
    const name = getDisplayName(account);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Team</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isPrimary
              ? "Manage accounts for your company"
              : "View all accounts in your company"}
          </p>
        </div>
        {isPrimary && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <IconPlus className="size-4" />
            Add Member
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingToggle}
        title={pendingToggle?.is_active ? "Deactivate Member" : "Reactivate Member"}
        description={
          pendingToggle?.is_active
            ? `${pendingToggle ? getDisplayName(pendingToggle) : ""} will lose access to the dashboard. You can reactivate them at any time.`
            : `${pendingToggle ? getDisplayName(pendingToggle) : ""} will regain access to the dashboard.`
        }
        confirmLabel={pendingToggle?.is_active ? "Deactivate" : "Reactivate"}
        isLoading={!!actionLoadingId}
        onConfirm={confirmToggleActive}
        onCancel={() => setPendingToggle(null)}
      />

      {/* Add Member Modal */}
      {isAddModalMounted && (
        <OverlayPortal>
        <div className="fixed inset-0 z-50 h-dvh">
          <div
            ref={addModalOverlayRef}
            className="absolute inset-0 h-dvh bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={addModalPanelRef}
              className="relative bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-lg z-10"
            >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
            >
              <IconX className="size-4" />
            </button>
            <h2 className="text-xl font-semibold mb-1 tracking-tight">Add Team Member</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The new member will receive a welcome email with login instructions.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Juan"
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="dela Cruz"
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@expresscargo.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+63 912 345 6789"
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>

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
                  {isSubmitting ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
        </OverlayPortal>
      )}

      {/* Account List */}
      {isLoading ? (
        <TeamMembersSkeleton />
      ) : accounts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-16 text-center flex flex-col items-center justify-center">
          <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <IconUsersGroup className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No team members yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {isPrimary
              ? "Add accounts for your team so they can manage bookings and fleet."
              : "Your company hasn't added any team members yet."}
          </p>
          {isPrimary && (
            <button
              onClick={openAddModal}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <IconPlus className="size-4" />
              Add Member
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[2.5fr_2fr_120px_100px_80px] gap-4 px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <div>Member</div>
            <div>Email</div>
            <div>Role</div>
            <div>Status</div>
            {isPrimary && <div className="text-right">Actions</div>}
          </div>

          <div
            ref={listRef}
            className="flex flex-col gap-3"
          >
            {accounts.map((account) => {
              const isSelf = account.id === currentAccountId;
              const displayName = getDisplayName(account);
              const initials = getInitials(account);

              return (
                <div
                  key={account.id}
                  className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:border-border transition-all duration-300 group"
                >
                  <div className="flex flex-col md:grid md:grid-cols-[2.5fr_2fr_120px_100px_80px] gap-4 px-5 py-4 items-start md:items-center">
                    {/* Member */}
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0 border border-primary/20">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary border border-primary/20 leading-none">
                              You
                            </span>
                          )}
                        </div>
                        {account.phone && (
                          <span className="text-xs text-muted-foreground">{account.phone}</span>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <span className="text-sm text-muted-foreground truncate pl-13 md:pl-0">
                      {account.email}
                    </span>

                    {/* Role */}
                    <div className="pl-13 md:pl-0">
                      {account.is_primary ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                          <IconShield className="size-3" />
                          Primary
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                          <IconUser className="size-3" />
                          Member
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="pl-13 md:pl-0">
                      {account.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {isPrimary && (
                      <div className="flex justify-end pl-13 md:pl-0">
                        {!isSelf && !account.is_primary && (
                          <button
                            onClick={() => setPendingToggle(account)}
                            disabled={actionLoadingId === account.id}
                            className={`p-2 rounded-lg transition-colors ${
                              account.is_active
                                ? "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            }`}
                            title={account.is_active ? "Deactivate account" : "Reactivate account"}
                          >
                            {actionLoadingId === account.id ? (
                              <IconLoader2 className="size-4 animate-spin" />
                            ) : account.is_active ? (
                              <IconUserX className="size-4" />
                            ) : (
                              <IconPower className="size-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
