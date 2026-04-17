"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconFilter,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconReceipt,
} from "@tabler/icons-react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  authService,
  type Booking,
} from "@/services/auth.service";
import { BookingDrawer } from "@/components/booking/booking-drawer";
import { BookingsStatsSkeleton, BookingsTableSkeleton } from "@/components/ui/skeletons";
import { useGsapDropdownPresence } from "@/lib/gsap-animations";

const STATUSES = ["all", "confirmed", "pending", "cancelled"];
const DATE_RANGES = ["all", "today", "week", "month"] as const;
type DateRange = typeof DATE_RANGES[number];
const DATE_RANGE_LABELS: Record<DateRange, string> = { all: "All Time", today: "Today", week: "This Week", month: "This Month" };
const PAGE_SIZE = 20;

function isInDateRange(isoDate: string | null, range: DateRange): boolean {
  if (range === "all" || !isoDate) return true;
  const date = new Date(isoDate);
  const now = new Date();
  if (range === "today") {
    return date.toDateString() === now.toDateString();
  }
  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }
  if (range === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true;
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [page, setPage] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilterPanel) return;
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterPanel]);

  const { mounted: isFilterMounted, dropdownRef: filterDropdownRef } = useGsapDropdownPresence(showFilterPanel);

  const { data, isPending: isLoading } = useQuery({
    queryKey: ["bookings", statusFilter, page],
    queryFn: () =>
      authService.getBookings({
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 60 * 1000,
  });

  const filteredBookings =
    data?.bookings.filter((b: Booking) => {
      if (search) {
        const term = search.toLowerCase();
        const matchesSearch =
          b.reference_no.toLowerCase().includes(term) ||
          b.shipper_vehicle_plate?.toLowerCase().includes(term) ||
          b.tenant_name.toLowerCase().includes(term) ||
          b.route_code?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      if (!isInDateRange(b.created_at, dateRange)) return false;
      if (selectedTenants.length > 0 && !selectedTenants.includes(b.tenant_id)) return false;
      return true;
    }) ?? [];

  const activeFilterCount = selectedTenants.length;

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "pending":
      case "requested":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const statusBorderColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "border border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 bg-transparent";
      case "pending":
      case "requested":
        return "border border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 bg-transparent";
      case "cancelled":
        return "border border-red-200 text-red-700 dark:border-red-800 dark:text-red-400 bg-transparent";
      default:
        return "border border-border text-muted-foreground bg-transparent";
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your vehicle shipments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["bookings"] })}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <IconRefresh className="size-4" />
          </button>
          <Link
            href="/bookings/create"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <IconPlus className="size-4" />
            New Booking
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      {isLoading ? (
        <BookingsStatsSkeleton />
      ) : data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col p-6 rounded-xl border border-border bg-card shadow-sm bg-gradient-to-t from-primary/5 to-transparent">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Bookings</h3>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{data.stats.total}</div>
          </div>
          <div className="flex flex-col p-6 rounded-xl border border-border bg-card shadow-sm bg-gradient-to-t from-emerald-500/5 to-transparent">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Confirmed</h3>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{data.stats.confirmed}</div>
          </div>
          <div className="flex flex-col p-6 rounded-xl border border-border bg-card shadow-sm bg-gradient-to-t from-amber-500/5 to-transparent">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Pending</h3>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{data.stats.pending}</div>
          </div>
          <div className="flex flex-col p-6 rounded-xl border border-border bg-card shadow-sm bg-gradient-to-t from-violet-500/5 to-transparent">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Expenditure</h3>
            <div className="text-2xl font-semibold tabular-nums text-foreground">₱{data.stats.total_revenue.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterPanel((v) => !v)}
              className={`relative flex items-center justify-center p-2 rounded-md border shadow-sm h-9 w-9 transition-colors ${
                showFilterPanel || activeFilterCount > 0
                  ? "border-primary text-primary bg-primary/5"
                  : "border-input text-muted-foreground bg-background hover:bg-muted"
              }`}
            >
              <IconFilter className="size-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {isFilterMounted && (
              <div
                ref={filterDropdownRef}
                className="absolute left-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground">Filters</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setSelectedTenants([]); setPage(0); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {data?.tenants && data.tenants.length > 0 ? (
                  <div className="p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      Shipping Line
                    </p>
                    <div className="space-y-0.5">
                      {data.tenants.map((tenant) => (
                        <label
                          key={tenant.tenant_id}
                          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTenants.includes(tenant.tenant_id)}
                            onChange={(e) => {
                              setSelectedTenants((prev) =>
                                e.target.checked
                                  ? [...prev, tenant.tenant_id]
                                  : prev.filter((id) => id !== tenant.tenant_id),
                              );
                              setPage(0);
                            }}
                            className="size-3.5 rounded accent-primary"
                          />
                          <span className="text-sm text-foreground flex-1 truncate">{tenant.tenant_name}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{tenant.booking_count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No shipping lines found</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Status:</span>
            <div className="flex rounded-md border border-border overflow-hidden bg-background shadow-sm">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(0); }}
                  className={`px-3 py-1.5 text-sm font-medium capitalize transition-all ${statusFilter === s ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex rounded-md border border-border overflow-hidden bg-background shadow-sm">
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => { setDateRange(r); setPage(0); }}
                className={`px-3 py-1.5 text-sm font-medium transition-all ${dateRange === r ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                {DATE_RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50">
          <h3 className="font-semibold leading-none tracking-tight text-foreground">All Bookings</h3>
          <p className="text-sm text-muted-foreground pt-1">
            Manage shipper reservations and bookings
          </p>
        </div>

        {isLoading ? (
          <BookingsTableSkeleton />
        ) : filteredBookings.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <IconReceipt className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No bookings found</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {search || statusFilter !== "all" || dateRange !== "all" || selectedTenants.length > 0
                ? "Try adjusting your filters to see more results."
                : "You haven't made any bookings yet. Start by selecting a route."}
            </p>
            {!search && statusFilter === "all" && dateRange === "all" && selectedTenants.length === 0 && (
              <Link
                href="/bookings/create"
                className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <IconPlus className="size-4" />
                Create First Booking
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="h-12 px-6 font-semibold align-middle">Booking Ref</th>
                  <th className="h-12 px-6 font-semibold align-middle">Status</th>
                  <th className="h-12 px-6 font-semibold align-middle">Route</th>
                  <th className="h-12 px-6 font-semibold align-middle">Tenant</th>
                  <th className="h-12 px-6 font-semibold align-middle">Vehicle</th>
                  <th className="h-12 px-6 font-semibold align-middle">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="p-6 align-middle font-mono font-medium text-foreground">
                      {booking.reference_no}
                    </td>
                    <td className="p-6 align-middle">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusBorderColor(booking.booking_status)}`}>
                        {booking.booking_status}
                      </span>
                    </td>
                    <td className="p-6 align-middle text-foreground font-mono">
                      {booking.route_code ? `${booking.src_port_code} → ${booking.dest_port_code}` : "—"}
                    </td>
                    <td className="p-6 align-middle text-foreground">
                      {booking.tenant_name}
                    </td>
                    <td className="p-6 align-middle text-muted-foreground font-mono">
                      {booking.shipper_vehicle_plate || "—"}
                    </td>
                    <td className="p-6 align-middle text-foreground tabular-nums">
                      {booking.shipper_rate_amount ? `₱${Number(booking.shipper_rate_amount).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-border bg-card">
            <span className="text-sm text-muted-foreground">
              Showing {filteredBookings.length} of {data?.total} Bookings · Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <BookingDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}
