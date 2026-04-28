/**
 * Formatting utilities for receipt field values.
 * Ported from the TMS ticket-print format — kept identical for receipt continuity.
 */

const PHP_LOCALE = "en-PH";

/** ₱1,250.00 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `₱${Number(amount).toLocaleString(PHP_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** 02/20/2026 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(PHP_LOCALE, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/** 08:00 AM */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(PHP_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** 02/20/2026 08:00 AM */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

/** Blank/null → fallback dash. */
export function orDash(value: string | null | undefined): string {
  return value?.trim() || "—";
}
