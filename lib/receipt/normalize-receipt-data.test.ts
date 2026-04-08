import { describe, expect, it } from "vitest";
import { resolveReceiptTemplates } from "./normalize-receipt-data";
import type { ReceiptData, TicketTemplate } from "./types";
import { THERMAL_80MM } from "./types";

function tpl(
  id: string,
  ticket_type: TicketTemplate["ticket_type"],
): TicketTemplate {
  return {
    id,
    ticket_type,
    template_name: "x",
    version: 1,
    status: "PUBLISHED",
    created_at: "",
    updated_at: "",
    template_json: {
      ticketType: ticket_type,
      paper: THERMAL_80MM,
      copies: {
        copy1: { enabled: true },
        copy2: { enabled: false },
      },
      regions: {},
      fields: {},
      settings: {
        surcharges: { enabled: false, defaultIncludedCodes: [] },
        cargoOptions: null,
      },
    },
  };
}

describe("resolveReceiptTemplates", () => {
  it("prefers split templates when present", () => {
    const pax = tpl("1", "PAX_OTC");
    const cargo = tpl("2", "CARGO_OTC");
    const data: ReceiptData = {
      booking: {} as ReceiptData["booking"],
      template: cargo,
      templates: { pax, cargo },
      settings: null,
    };
    expect(resolveReceiptTemplates(data)).toEqual({ pax, cargo });
  });

  it("falls back to single legacy template field", () => {
    const cargo = tpl("2", "CARGO_OTC");
    const data: ReceiptData = {
      booking: {} as ReceiptData["booking"],
      template: cargo,
      settings: null,
    };
    expect(resolveReceiptTemplates(data)).toEqual({ pax: null, cargo });
  });
});
