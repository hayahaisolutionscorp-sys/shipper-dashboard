export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border/50 p-6 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-muted/40" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 bg-muted/50 rounded" />
            <div className="h-8 w-20 bg-muted/60 rounded" />
            <div className="h-3 w-32 bg-muted/30 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Area chart skeleton */}
      <div className="lg:col-span-7 bg-card rounded-2xl border border-border/50 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-muted/60 rounded" />
            <div className="h-3 w-40 bg-muted/40 rounded" />
          </div>
          <div className="h-4 w-16 bg-muted/40 rounded" />
        </div>
        <div className="h-56 md:h-64 flex items-end gap-1 px-6 pt-4">
          {[35, 55, 40, 70, 60, 85, 75, 90, 65, 50, 80, 68].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-muted/30 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Donut chart skeleton */}
      <div className="lg:col-span-5 bg-card rounded-2xl border border-border/50 p-6 animate-pulse">
        <div className="space-y-1.5 mb-4">
          <div className="h-4 w-28 bg-muted/60 rounded" />
          <div className="h-3 w-36 bg-muted/40 rounded" />
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="size-40 rounded-full bg-muted/20 border-[14px] border-muted/40" />
          <div className="w-full space-y-2.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-muted/50" />
                  <div className="h-3 w-16 bg-muted/40 rounded" />
                </div>
                <div className="h-3 w-8 bg-muted/50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spend by route skeleton */}
      <div className="lg:col-span-7 bg-card rounded-2xl border border-border/50 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-muted/60 rounded" />
            <div className="h-3 w-28 bg-muted/40 rounded" />
          </div>
        </div>
        <div className="space-y-4">
          {[85, 70, 55, 40, 30].map((w, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-3 w-20 bg-muted/40 rounded" />
                <div className="h-3 w-16 bg-muted/40 rounded" />
              </div>
              <div className="w-full h-2.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-muted/50 rounded-full" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping lines skeleton */}
      <div className="lg:col-span-5 bg-card rounded-2xl border border-border/50 p-6 animate-pulse">
        <div className="space-y-1.5 mb-5">
          <div className="h-4 w-28 bg-muted/60 rounded" />
          <div className="h-3 w-32 bg-muted/40 rounded" />
        </div>
        <div className="w-full h-3 bg-muted/30 rounded-full mb-5" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-muted/50" />
                <div className="h-3 w-24 bg-muted/40 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-6 bg-muted/40 rounded" />
                <div className="h-3 w-8 bg-muted/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-32 bg-muted/60 rounded" />
          <div className="h-3 w-20 bg-muted/40 rounded" />
        </div>
        <div className="h-7 w-20 bg-muted/40 rounded-lg" />
      </div>
      <div className="divide-y divide-border/50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="size-9 rounded-lg bg-muted/40 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-muted/50 rounded w-1/2" />
              <div className="h-2.5 bg-muted/30 rounded w-1/3" />
            </div>
            <div className="h-6 w-16 bg-muted/40 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
