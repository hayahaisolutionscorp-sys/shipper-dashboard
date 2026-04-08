import { describe, expect, it } from "vitest";
import { buildReceiptPrintJobs } from "./build-print-jobs";
import type { BookingView, TicketTemplate } from "./types";
import { THERMAL_80MM } from "./types";

function mkTemplate(
  id: string,
  ticket_type: TicketTemplate["ticket_type"],
  copy2Enabled: boolean,
  summaryCopies = 1,
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
        copy2: { enabled: copy2Enabled },
      },
      regions: {},
      fields: {},
      settings: {
        surcharges: { enabled: false, defaultIncludedCodes: [] },
        cargoOptions: null,
        summaryCopies,
      },
    },
  };
}

const baseBooking: BookingView = {
  id: "b1",
  reference_no: "REF-1",
  issued_by: "u",
  status: "ok",
  bir_invoice_no: null,
  payment_status: "paid",
  booking_date: "2026-01-15T00:00:00.000Z",
  is_round_trip: false,
  booking_status: "confirmed",
  booking_type: "x",
  source: "ONLINE",
  has_passengers: true,
  has_cargo: true,
  payment_method: "card",
  total_price: 100,
  trips: {
    departure: [
      {
        id: "t1",
        sequence: 1,
        origin: "A",
        destination: "B",
        departure: "2026-01-20T08:00:00.000Z",
        arrival: "2026-01-20T12:00:00.000Z",
        ship_name: "S1",
        passengers: [
          {
            id: "pid",
            bookingTripPassengerId: "btp1",
            name: "Jane Doe",
            discountType: "Regular",
            accommodation: "Eco",
            checkInStatus: "pending",
            checkInTime: null,
            bookingStatus: "ok",
            removedReason: null,
            removedReasonType: null,
            price: 50,
          },
        ],
        vehicles: [
          {
            id: "vid",
            bookingTripCargoId: "btc1",
            plateNumber: "ABC-1",
            make: "Toyota",
            model: "Hiace",
            type: "Van",
            checkInStatus: "pending",
            checkInTime: null,
            bookingStatus: "ok",
            removedReason: null,
            removedReasonType: null,
            price: 50,
          },
        ],
        cargo: [],
      },
    ],
    return: [],
  },
  payment_breakdown: {
    base_fare: 100,
    passengers_fare: 50,
    cargo_fare: 50,
    charges_total: 0,
    taxes_total: 0,
    charges: [],
    taxes: [],
  },
};

describe("buildReceiptPrintJobs", () => {
  it("creates pax job with pax template and cargo jobs with cargo template", () => {
    const paxT = mkTemplate("p1", "PAX_OTC", false);
    const cargoT = mkTemplate("c1", "CARGO_OTC", false);
    const { jobs, summary } = buildReceiptPrintJobs(
      baseBooking,
      paxT,
      cargoT,
      null,
    );
    expect(jobs).toHaveLength(2);
    expect(jobs[0].key).toMatch(/^pax-/);
    expect(jobs[0].template).toBe(paxT);
    expect(jobs[1].key).toMatch(/^vehicle-/);
    expect(jobs[1].template).toBe(cargoT);
    expect(summary).toBeNull();
  });

  it("uses trip.cargos when cargo array is aliased", () => {
    const booking: BookingView = {
      ...baseBooking,
      trips: {
        departure: [
          {
            ...baseBooking.trips.departure[0],
            passengers: [],
            vehicles: [],
            cargo: [],
            cargos: [
              {
                id: "cid",
                bookingTripCargoId: "btc2",
                description: "Boxes",
                unitWeight: 10,
                quantity: 2,
                checkInStatus: "pending",
                checkInTime: null,
                bookingStatus: "ok",
                removedReason: null,
                removedReasonType: null,
                price: 25,
              },
            ],
          },
        ],
        return: [],
      },
    };
    const cargoT = mkTemplate("c1", "CARGO_OTC", false);
    const { jobs } = buildReceiptPrintJobs(booking, null, cargoT, null);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].key).toMatch(/^cargo-/);
  });

  it("adds summary when copy2 is enabled on control template", () => {
    const paxT = mkTemplate("p1", "PAX_OTC", true, 2);
    const cargoT = mkTemplate("c1", "CARGO_OTC", false);
    const { summary, summaryCopies } = buildReceiptPrintJobs(
      baseBooking,
      paxT,
      cargoT,
      null,
    );
    expect(summary).not.toBeNull();
    expect(summary?.referenceNo).toBe("REF-1");
    expect(summaryCopies).toBe(2);
  });
});
