"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

import {
  IconCar,
  IconUsers,
  IconReceipt,
  IconCurrencyPeso,
  IconChevronRight,
  IconWallet,
  IconChartBar,
} from "@tabler/icons-react";
import type { BookingStats } from "@/services/auth.service";
import { GSAP } from "@/lib/gsap-animations";

function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface DashboardStatsProps {
  vehicles: number;
  personnel: number;
  routes: number;
  partnerLines: number;
  activeVehicles: number;
  drivers: number;
  helpers: number;
  bookingStats: BookingStats | null;
  creditBalance?: number;
}

const StatCard = ({
  label,
  value,
  displayValue,
  icon: Icon,
  subtext,
  colorClass = "text-primary",
  bgClass = "bg-primary/10",
  ringClass = "ring-primary/20",
  href,
  prefix = "",
  animateNumber = false,
}: {
  label: string;
  value: number;
  displayValue?: string;
  icon: any;
  subtext?: string;
  colorClass?: string;
  bgClass?: string;
  ringClass?: string;
  href?: string;
  prefix?: string;
  animateNumber?: boolean;
}) => {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLParagraphElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    if (prefersReducedMotion) {
      gsap.set(card, { opacity: 1, y: 0, scale: 1, clearProps: "transform" });
      return;
    }

    const entranceTween = gsap.fromTo(
      card,
      { opacity: 0, y: 8, scale: 0.99 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: GSAP.springSnap.duration,
        ease: "power2.out",
      },
    );

    if (animateNumber && valueRef.current && value > 0) {
      const obj = { val: 0 };
      const countTween = gsap.to(obj, {
        val: value,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.1,
        snap: { val: 1 },
        onUpdate: () => {
          if (valueRef.current) {
            if (prefix === "₱") {
              valueRef.current.textContent = `₱${Math.round(obj.val).toLocaleString()}`;
            } else {
              valueRef.current.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}`;
            }
          }
        },
      });

      return () => {
        entranceTween.kill();
        countTween.kill();
      };
    }
    return () => {
      entranceTween.kill();
    };
  }, [value, animateNumber, prefix, prefersReducedMotion]);

  return (
    <div
      ref={cardRef}
      onClick={href ? () => router.push(href) : undefined}
      className={`relative overflow-hidden bg-card rounded-2xl border border-border/50 p-6 flex flex-col justify-between h-full shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_28px_-12px_rgba(0,0,0,0.16)] hover:-translate-y-[2px] transition-all duration-200 will-change-transform group ${href ? "cursor-pointer" : ""}`}
      style={{ opacity: 0 }}
    >
      {/* Giant faint background icon for premium depth */}
      <div className="absolute -top-4 -right-4 p-6 opacity-[0.025] group-hover:opacity-[0.04] pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
        <Icon className="size-32" />
      </div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass} ring-1 ring-inset ${ringClass}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground mb-1.5">{label}</h3>
        <p
          ref={valueRef}
          className="text-3xl font-bold text-foreground tabular-nums tracking-tight"
        >
          {displayValue ?? `${prefix}${value.toLocaleString()}`}
        </p>
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
  creditBalance,
}: DashboardStatsProps) {
  const totalSpend = bookingStats?.total_revenue ?? 0;
  const totalBookings = bookingStats?.total ?? 0;
  const avgCost = totalBookings > 0 ? Math.round(totalSpend / totalBookings) : 0;
  const successRate = totalBookings > 0
    ? Math.round(((bookingStats?.confirmed ?? 0) / totalBookings) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-5">
      <StatCard
        label="Total Spend"
        value={totalSpend}
        icon={IconCurrencyPeso}
        colorClass="text-violet-600 dark:text-violet-400"
        bgClass="bg-violet-100 dark:bg-violet-900/20"
        ringClass="ring-violet-200 dark:ring-violet-800"
        prefix="₱"
        animateNumber
        href="/bookings"
      />
      <StatCard
        label="Credit Balance"
        value={creditBalance ?? 0}
        icon={IconWallet}
        colorClass="text-teal-600 dark:text-teal-400"
        bgClass="bg-teal-100 dark:bg-teal-900/20"
        ringClass="ring-teal-200 dark:ring-teal-800"
        prefix="₱"
        animateNumber
        href="/credits"
      />
      <StatCard
        label="Total Bookings"
        value={totalBookings}
        icon={IconReceipt}
        colorClass="text-blue-600 dark:text-blue-400"
        bgClass="bg-blue-100 dark:bg-blue-900/20"
        ringClass="ring-blue-200 dark:ring-blue-800"
        subtext={bookingStats ? `${bookingStats.confirmed} confirmed · ${bookingStats.pending} pending` : undefined}
        animateNumber
        href="/bookings"
      />
      <StatCard
        label="Avg. Cost / Booking"
        value={avgCost}
        icon={IconChartBar}
        colorClass="text-rose-600 dark:text-rose-400"
        bgClass="bg-rose-100 dark:bg-rose-900/20"
        ringClass="ring-rose-200 dark:ring-rose-800"
        prefix="₱"
        subtext={`${successRate}% success rate`}
        animateNumber
      />
      <StatCard
        label="Active Vehicles"
        value={activeVehicles}
        icon={IconCar}
        colorClass="text-emerald-600 dark:text-emerald-400"
        bgClass="bg-emerald-100 dark:bg-emerald-900/20"
        ringClass="ring-emerald-200 dark:ring-emerald-800"
        subtext={`${vehicles} total`}
        animateNumber
        href="/vehicles"
      />
      <StatCard
        label="Personnel"
        value={personnel}
        icon={IconUsers}
        colorClass="text-amber-600 dark:text-amber-400"
        bgClass="bg-amber-100 dark:bg-amber-900/20"
        ringClass="ring-amber-200 dark:ring-amber-800"
        subtext={`${drivers} Drivers · ${helpers} Helpers`}
        animateNumber
        href="/personnel"
      />
    </div>
  );
}
