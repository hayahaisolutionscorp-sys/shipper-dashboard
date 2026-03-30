export type ActivityCategory = "vehicle" | "personnel" | "booking" | "account";

export interface ActivityEntry {
  id: string;
  category: ActivityCategory;
  action: string;
  description: string;
  timestamp: string;
}

const MAX_ENTRIES = 50;
const STORAGE_KEY = "ayahay_shipper_activity";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function logActivity(
  category: ActivityCategory,
  action: string,
  description: string,
): void {
  if (typeof window === "undefined") return;
  const existing: ActivityEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  const entry: ActivityEntry = {
    id: generateId(),
    category,
    action,
    description,
    timestamp: new Date().toISOString(),
  };
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getActivities(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
}

export function clearActivities(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
