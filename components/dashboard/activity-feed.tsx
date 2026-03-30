"use client";

import { useEffect, useState } from "react";
import {
  IconCar,
  IconUsers,
  IconReceipt,
  IconUser,
  IconRefresh,
  IconTimeline,
} from "@tabler/icons-react";
import { getActivities, clearActivities, type ActivityEntry, type ActivityCategory } from "@/lib/activity-logger";

const categoryConfig: Record<ActivityCategory, { icon: any; color: string; bg: string }> = {
  vehicle: { icon: IconCar, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  personnel: { icon: IconUsers, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  booking: { icon: IconReceipt, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  account: { icon: IconUser, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [, setTick] = useState(0);

  const refresh = () => setActivities(getActivities());

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center">
            <IconTimeline className="size-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground">Changes made this session</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <IconRefresh className="size-3.5" />
          </button>
          {activities.length > 0 && (
            <button
              onClick={() => { clearActivities(); setActivities([]); }}
              className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center flex-1">
          <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
            <IconTimeline className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Actions like adding vehicles or updating personnel will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50 overflow-y-auto max-h-[340px]">
          {activities.map((entry) => {
            const config = categoryConfig[entry.category];
            const Icon = config.icon;
            return (
              <div key={entry.id} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className={`shrink-0 size-8 rounded-lg flex items-center justify-center ${config.bg} ${config.color}`}>
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">{entry.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-muted-foreground whitespace-nowrap" title={formatTimestamp(entry.timestamp)}>
                    {formatRelativeTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
