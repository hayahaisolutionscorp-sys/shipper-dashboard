export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-muted/60 rounded" />
            <div className="size-8 rounded-lg bg-muted/40" />
          </div>
          <div className="h-8 w-20 bg-muted/60 rounded" />
          <div className="h-3 w-32 bg-muted/40 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6 h-80 animate-pulse flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-muted/60 rounded" />
          <div className="h-7 w-24 bg-muted/40 rounded-lg" />
        </div>
        <div className="flex-1 flex items-end gap-2 pt-4">
          {[45, 70, 55, 80, 60, 90, 75].map((h, i) => (
            <div key={i} className="flex-1 bg-muted/40 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-2 w-6 bg-muted/30 rounded" />
          ))}
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border/50 p-6 h-80 animate-pulse flex flex-col gap-4">
        <div className="h-4 w-28 bg-muted/60 rounded" />
        <div className="flex-1 flex items-center justify-center">
          <div className="size-36 rounded-full bg-muted/30 border-[16px] border-muted/50" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-muted/50" />
              <div className="h-2.5 bg-muted/40 rounded flex-1" />
              <div className="h-2.5 w-8 bg-muted/50 rounded" />
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
