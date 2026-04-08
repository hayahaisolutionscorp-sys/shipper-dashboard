import type { ReceiptData, TicketTemplate } from "./types";

/**
 * Resolves PAX vs CARGO published templates from API payload.
 * New APIs return `templates: { pax, cargo }`; legacy responses only set `template`.
 */
export function resolveReceiptTemplates(data: ReceiptData): {
  pax: TicketTemplate | null;
  cargo: TicketTemplate | null;
} {
  const fromSplit = data.templates;
  if (fromSplit) {
    return {
      pax: fromSplit.pax ?? null,
      cargo: fromSplit.cargo ?? null,
    };
  }

  const t = data.template;
  if (!t) {
    return { pax: null, cargo: null };
  }

  const tt = t.ticket_type;
  if (tt === "PAX_OTC" || tt === "PAX_ONLINE") {
    return { pax: t, cargo: null };
  }
  if (tt === "CARGO_OTC" || tt === "CARGO_ONLINE") {
    return { pax: null, cargo: t };
  }

  return { pax: null, cargo: null };
}
