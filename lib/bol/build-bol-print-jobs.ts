/**
 * BOL print jobs — TMS BOLDescriptor.buildJobs parity (vehicles only).
 */

import { buildBOLFieldValues } from "@/lib/receipt/field-values";
import type {
  BookingView,
  ShippingLineSettings,
  TicketTemplate,
} from "@/lib/receipt/types";

export interface BolPrintJob {
  key: string;
  template: TicketTemplate;
  fieldValues: Record<string, string>;
}

export function buildBolPrintJobs(
  booking: BookingView,
  template: TicketTemplate | null,
  settings: ShippingLineSettings | null,
): BolPrintJob[] {
  if (!template) return [];

  const allTrips = [
    ...(booking.trips?.departure ?? []),
    ...(booking.trips?.return ?? []),
  ];

  const jobs: BolPrintJob[] = [];
  for (const trip of allTrips) {
    for (const [i, vehicle] of (trip.vehicles ?? []).entries()) {
      jobs.push({
        key: `bol-${trip.id}-${i}`,
        template,
        fieldValues: buildBOLFieldValues(booking, trip, vehicle, settings),
      });
    }
  }
  return jobs;
}
