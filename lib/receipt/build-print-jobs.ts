import {
  buildLooseCargoFieldValues,
  buildPaxFieldValues,
  buildVehicleFieldValues,
  buildSummaryValues,
  type FieldValues,
  type SummaryValues,
} from "./field-values";
import type { BookingCargo, BookingView, TicketTemplate, TicketType } from "./types";

export interface ReceiptPrintJob {
  key: string;
  template: TicketTemplate;
  fieldValues: FieldValues;
}

const PAX_TYPES = new Set<TicketType>(["PAX_OTC", "PAX_ONLINE"]);
const CARGO_TYPES = new Set<TicketType>(["CARGO_OTC", "CARGO_ONLINE"]);

function looseCargoList(trip: {
  cargo?: BookingCargo[];
  cargos?: BookingCargo[];
}): BookingCargo[] {
  const c = trip.cargo;
  if (c && c.length > 0) return c;
  const g = trip.cargos;
  if (g && g.length > 0) return g;
  return c ?? g ?? [];
}

export interface BuildReceiptPrintJobsResult {
  jobs: ReceiptPrintJob[];
  summary: SummaryValues | null;
  summaryCopies: number;
  /** Paper from the template descriptor used first (pax, else cargo). */
  paperFromTemplate: TicketTemplate | null;
}

/**
 * TMS-equivalent receipt job expansion: separate PAX vs CARGO templates,
 * optional transaction summary when copy2 is enabled on the control template.
 */
export function buildReceiptPrintJobs(
  booking: BookingView,
  paxTemplate: TicketTemplate | null,
  cargoTemplate: TicketTemplate | null,
  settings: import("./types").ShippingLineSettings | null,
): BuildReceiptPrintJobsResult {
  const allTrips = [
    ...(booking.trips?.departure ?? []),
    ...(booking.trips?.return ?? []),
  ];

  const hasPax = allTrips.some((t) => (t.passengers ?? []).length > 0);

  const jobs: ReceiptPrintJob[] = [];

  if (paxTemplate && PAX_TYPES.has(paxTemplate.ticket_type as TicketType)) {
    for (const trip of allTrips) {
      for (const [i, passenger] of (trip.passengers ?? []).entries()) {
        jobs.push({
          key: `pax-${trip.id}-${i}`,
          template: paxTemplate,
          fieldValues: buildPaxFieldValues(booking, trip, passenger, settings),
        });
      }
    }
  }

  if (cargoTemplate && CARGO_TYPES.has(cargoTemplate.ticket_type as TicketType)) {
    for (const trip of allTrips) {
      for (const [i, vehicle] of (trip.vehicles ?? []).entries()) {
        jobs.push({
          key: `vehicle-${trip.id}-${i}`,
          template: cargoTemplate,
          fieldValues: buildVehicleFieldValues(booking, trip, vehicle, settings),
        });
      }

      const loose = looseCargoList(trip);
      for (const [i, cargo] of loose.entries()) {
        jobs.push({
          key: `cargo-${trip.id}-${i}`,
          template: cargoTemplate,
          fieldValues: buildLooseCargoFieldValues(booking, trip, cargo, settings),
        });
      }
    }
  }

  const controlTemplate = hasPax
    ? paxTemplate ?? cargoTemplate
    : cargoTemplate ?? paxTemplate;

  let summary: SummaryValues | null = null;
  let summaryCopies = 0;

  if (controlTemplate?.template_json?.copies?.copy2?.enabled) {
    summary = buildSummaryValues(booking, settings ?? undefined);
    const raw = controlTemplate.template_json.settings?.summaryCopies ?? 1;
    summaryCopies = Math.max(1, Math.min(10, Math.floor(Number(raw) || 1)));
  }

  const paperFromTemplate = paxTemplate ?? cargoTemplate;

  return {
    jobs,
    summary,
    summaryCopies,
    paperFromTemplate,
  };
}
