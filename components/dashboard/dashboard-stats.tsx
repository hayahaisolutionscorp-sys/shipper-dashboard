"use client";

import { useRouter } from "next/navigation";

import {
  IconCar,
  IconUsers,
  IconReceipt,
  IconCurrencyPeso,
  IconArrowUpRight,
  IconArrowDownRight,
  IconChevronRight,
} from "@tabler/icons-react";
import type { BookingStats } from "@/services/auth.service";

interface DashboardStatsProps {
  vehicles: number;
  personnel: number;
  routes: number;
  partnerLines: number;
  activeVehicles: number;
  drivers: number;
  helpers: number;
  bookingStats: BookingStats | null;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  subtext,
  colorClass = "text-primary",
  bgClass = "bg-primary/10",
  ringClass = "ring-primary/20",
  href,
}: {
  label: string;
  value: string | number;
  icon: any;
  trend?: { value: string; up: boolean };
  subtext?: string;
  colorClass?: string;
  bgClass?: string;
  ringClass?: string;
  href?: string;
}) => {
  const router = useRouter();
  return (
  <div
    onClick={href ? () => router.push(href) : undefined}
    className={`relative overflow-hidden bg-card rounded-2xl border border-border/50 p-6 flex flex-col justify-between h-full shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:border-border transition-all duration-300 group ${href ? "cursor-pointer" : ""}`}
  >
    {/* Giant faint background icon for premium depth */}
    <div className="absolute -top-4 -right-4 p-6 opacity-[0.025] group-hover:opacity-[0.04] pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
      <Icon className="size-32" />
    </div>

    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass} ring-1 ring-inset ${ringClass}`}>
        <Icon className="size-5" />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${trend.up
          ? "border-emerald-200/50 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "border-red-200/50 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400"
          }`}>
          {trend.up ? <IconArrowUpRight className="size-3.5 mr-1" /> : <IconArrowDownRight className="size-3.5 mr-1" />}
          {trend.value}
        </div>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-sm font-medium text-muted-foreground mb-1.5">{label}</h3>
      <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-2 font-medium">{subtext}</p>}
    </div>
    {href && (
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconChevronRight className="size-4 text-muted-foreground" />
      </div>
    )}
  </div>
  );
};

export default function DashboardStats({
  vehicles,
  personnel,
  activeVehicles,
  drivers,
  helpers,
  bookingStats,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard
        label="Total Revenue"
        value={bookingStats ? `₱${bookingStats.total_revenue.toLocaleString()}` : "—"}
        icon={IconCurrencyPeso}
        colorClass="text-violet-600 dark:text-violet-400"
        bgClass="bg-violet-100 dark:bg-violet-900/20"
        ringClass="ring-violet-200 dark:ring-violet-800"
        href="/bookings"
      />
      <StatCard
        label="Total Bookings"
        value={bookingStats ? bookingStats.total : "—"}
        icon={IconReceipt}
        colorClass="text-blue-600 dark:text-blue-400"
        bgClass="bg-blue-100 dark:bg-blue-900/20"
        ringClass="ring-blue-200 dark:ring-blue-800"
        subtext={bookingStats ? `${bookingStats.confirmed} confirmed` : undefined}
        href="/bookings"
      />
      <StatCard
        label="Vehicles"
        value={activeVehicles}
        icon={IconCar}
        colorClass="text-emerald-600 dark:text-emerald-400"
        bgClass="bg-emerald-100 dark:bg-emerald-900/20"
        ringClass="ring-emerald-200 dark:ring-emerald-800"
        subtext={`out of ${vehicles} total vehicles`}
        href="/vehicles"
      />
      <StatCard
        label="Total Personnel"
        value={personnel}
        icon={IconUsers}
        colorClass="text-amber-600 dark:text-amber-400"
        bgClass="bg-amber-100 dark:bg-amber-900/20"
        ringClass="ring-amber-200 dark:ring-amber-800"
        subtext={`${drivers} Drivers · ${helpers} Helpers`}
        href="/personnel"
      />
    </div>
  );
}
