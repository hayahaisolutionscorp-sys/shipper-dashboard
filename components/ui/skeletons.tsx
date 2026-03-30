import React from "react";

export function BookingsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[
        "from-primary/5",
        "from-emerald-500/5",
        "from-amber-500/5",
        "from-violet-500/5",
      ].map((gradient, i) => (
        <div
          key={i}
          className={`flex flex-col p-6 rounded-xl border border-border bg-card shadow-sm bg-gradient-to-t ${gradient} to-transparent`}
        >
          <div className="h-3 w-28 bg-muted/60 rounded mb-3" />
          <div className="h-7 w-16 bg-muted/70 rounded" />
        </div>
      ))}
    </div>
  );
}

export function BookingsTableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1.5fr_100px_1fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-border/50 items-center last:border-0"
        >
          <div className="h-4 w-28 bg-muted/60 rounded font-mono" />
          <div className="h-6 w-20 bg-muted/40 rounded-md" />
          <div className="h-4 w-24 bg-muted/50 rounded" />
          <div className="h-4 w-28 bg-muted/40 rounded" />
          <div className="h-4 w-20 bg-muted/40 rounded font-mono" />
          <div className="h-4 w-14 bg-muted/50 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TeamMembersSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] grid grid-cols-[2.5fr_2fr_120px_100px_80px] gap-4 px-5 py-4 items-center"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted/50 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 bg-muted/60 rounded" />
              <div className="h-2.5 w-20 bg-muted/40 rounded" />
            </div>
          </div>
          <div className="h-3 w-40 bg-muted/40 rounded" />
          <div className="h-6 w-20 bg-muted/40 rounded-md" />
          <div className="h-6 w-16 bg-muted/40 rounded-md" />
          <div className="size-8 bg-muted/30 rounded-lg ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function VehiclesTableSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-[1.5fr_1.5fr_2fr_2fr_120px_100px] gap-4 px-6 py-4 items-center">
          {/* Plate */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted/40 animate-pulse" />
            <div className="h-4 w-24 bg-muted/40 rounded animate-pulse" />
          </div>
          {/* Type */}
          <div className="h-6 w-20 bg-muted/40 rounded animate-pulse" />
          {/* Driver */}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-muted/40 animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-24 bg-muted/40 rounded animate-pulse" />
              <div className="h-2 w-16 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
          {/* Helper */}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-muted/40 animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-3 w-24 bg-muted/40 rounded animate-pulse" />
              <div className="h-2 w-16 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
          {/* Status */}
          <div className="h-6 w-16 mx-auto bg-muted/40 rounded-full animate-pulse" />
          {/* Actions */}
          <div className="flex justify-end gap-2">
            <div className="size-8 bg-muted/40 rounded animate-pulse" />
            <div className="size-8 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PersonnelTableSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_100px] gap-4 px-6 py-4 items-center">
          {/* Name & Contact */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted/40 animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted/40 rounded animate-pulse" />
            </div>
          </div>
          {/* Role */}
          <div className="h-6 w-16 bg-muted/40 rounded-full animate-pulse" />
          {/* Status */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-9 bg-muted/40 rounded-full animate-pulse" />
            <div className="h-3 w-12 bg-muted/40 rounded animate-pulse" />
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-2">
            <div className="size-8 bg-muted/40 rounded animate-pulse" />
            <div className="size-8 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CreditsTransactionsSkeleton() {
  return (
    <div className="divide-y divide-border/50 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col md:grid md:grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 items-center"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-muted/50 shrink-0" />
            <div className="h-6 w-20 bg-muted/40 rounded-md" />
          </div>
          <div className="h-3.5 w-36 bg-muted/40 rounded" />
          <div className="h-3.5 w-24 bg-muted/40 rounded" />
          <div className="flex flex-col items-end gap-1">
            <div className="h-4 w-20 bg-muted/50 rounded" />
            <div className="h-3 w-28 bg-muted/30 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RouteCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 h-[160px] animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="flex gap-3">
          <div className="size-10 rounded-lg bg-muted/40 animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-20 bg-muted/40 rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="h-4 w-16 bg-muted/40 rounded animate-pulse" />
          <div className="h-3 w-12 bg-muted/40 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-10 bg-muted/40 rounded-lg w-full animate-pulse" />
    </div>
  );
}
