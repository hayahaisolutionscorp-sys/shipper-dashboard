/**
 * Field value mapping for receipt printing.
 * Ported from the TMS ticket-print field values — kept identical
 * so shipper-dashboard receipts match TMS output exactly.
 */

import { getBookingQRValue } from "./booking-qr";
import type {
  BookingCargo,
  BookingPassenger,
  BookingVehicle,
  BookingView,
  ShippingLineSettings,
  TripDetails,
} from "./types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  orDash,
} from "./format";

export type FieldValues = Record<string, string>;

function getPassengerQrId(passenger: BookingPassenger): string {
  return passenger.passenger_id ?? passenger.passengerId ?? passenger.id;
}

/** Helper to format VAT TIN as XXX-XXX-XXX-XXX */
function formatTIN(
  tin: string | null | undefined,
  branch: string | null | undefined,
): string {
  if (!tin) return "";
  const cleanTin = tin.replace(/[^0-9]/g, "");
  const chunks = cleanTin.match(/.{1,3}/g) || [];
  const base = chunks.join("-");
  return branch ? `${base}-${branch.padStart(3, "0")}` : base;
}

function formatChargeLines(
  items: Array<{ description: string; amount: number }> | undefined,
): string {
  if (!items || items.length === 0) return "—";
  const lines = items
    .filter((c) => c.amount !== 0)
    .map((c) => `${c.description}  ${formatCurrency(c.amount)}`);
  return lines.length > 0 ? lines.join("\n") : "—";
}

function findChargeAmount(
  items: Array<{ charge_code: string | null; amount: number }> | undefined,
  chargeCode: string,
): string {
  if (!items) return "—";
  const total = items
    .filter((c) => c.charge_code === chargeCode)
    .reduce((s, c) => s + c.amount, 0);
  return total === 0 ? "—" : formatCurrency(total);
}

function route(trip: TripDetails): string {
  return `${trip.origin} → ${trip.destination}`;
}

function formatAgeSex(
  passenger: Partial<{ sex?: string | null; birthday?: string | null }>,
  trip: TripDetails,
): string {
  const rawSex = passenger.sex ? String(passenger.sex).toLowerCase() : "";
  const sex =
    rawSex === "male" ? "M" : rawSex === "female" ? "F" : "";

  const birthdayStr = passenger.birthday ? String(passenger.birthday) : "";
  const birthday = birthdayStr ? new Date(birthdayStr) : null;
  const refDate = trip?.departure ? new Date(trip.departure) : new Date();

  let age: number | null = null;
  if (birthday && !Number.isNaN(birthday.getTime())) {
    let years = refDate.getFullYear() - birthday.getFullYear();
    const m = refDate.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && refDate.getDate() < birthday.getDate())) years--;
    age = Number.isFinite(years) ? years : null;
  }

  if (age == null && !sex) return "—";
  if (age != null && sex) return `${age} / ${sex}`;
  if (age != null) return String(age);
  return sex || "—";
}

// ─── Passenger Ticket ─────────────────────────────────────────────────────────

export function buildPaxFieldValues(
  booking: BookingView,
  trip: TripDetails,
  passenger: BookingPassenger,
  settings?: ShippingLineSettings | null,
): FieldValues {
  const breakdown = booking.payment_breakdown;

  return {
    shippingLineName: settings?.companyName || "",
    address: settings?.registeredAddress || "",
    vatTin: settings?.vatTin
      ? `TIN: ${formatTIN(settings.vatTin, settings.branchCode)}`
      : "",
    shippingLineLogo: settings?.logoUrl || "",
    siNumber: orDash(booking.bir_invoice_no),

    qrCode: getBookingQRValue(booking, {
      passengerId: getPassengerQrId(passenger),
    }),

    bookingDate: formatDate(booking.booking_date),
    validUntil: formatDate(trip.departure),

    paxName: orDash(passenger.name),
    ageSex: formatAgeSex(passenger as any, trip),
    refNo: booking.reference_no,
    route: route(trip),
    tripDateEtd: formatDateTime(trip.departure),
    eta: formatTime(trip.arrival),
    portGate: "—",
    vessel: orDash(trip.ship_name),
    accommodation: orDash(passenger.accommodation),
    seat: "—",
    paxClassification: orDash(passenger.discountType),

    freight: formatCurrency(passenger.baseFare ?? passenger.price),
    discount: "—",
    surchargesList: formatChargeLines(breakdown?.charges),
    vat: formatChargeLines(breakdown?.taxes),

    grandTotal: formatCurrency(passenger.price),
    totalOnly: formatCurrency(passenger.price),

    termsAndConditions: "",
    salesInvoiceNote: "",
    poweredBy: "",
  };
}

// ─── Vehicle (Rolling Cargo) Ticket ──────────────────────────────────────────

export function buildVehicleFieldValues(
  booking: BookingView,
  trip: TripDetails,
  vehicle: BookingVehicle,
  settings?: ShippingLineSettings | null,
): FieldValues {
  const displayModel = orDash(
    vehicle.modelName ??
      [vehicle.make, vehicle.model].filter(Boolean).join(" "),
  );
  const breakdown = (vehicle.payment_breakdown?.charges?.length ?? 0) > 0 || (vehicle.payment_breakdown?.taxes?.length ?? 0) > 0
    ? vehicle.payment_breakdown
    : booking.payment_breakdown;
  const nonInsuranceCharges = breakdown?.charges?.filter(
    (c) => c.charge_code !== "QUOTE_INSURANCE",
  );

  return {
    shippingLineName: settings?.companyName || "",
    address: settings?.registeredAddress || "",
    vatTin: settings?.vatTin
      ? `TIN: ${formatTIN(settings.vatTin, settings.branchCode)}`
      : "",
    shippingLineLogo: settings?.logoUrl || "",
    siNumber: orDash(booking.bir_invoice_no),

    qrCode: getBookingQRValue(booking, {
      cargoId: vehicle.bookingTripCargoId,
    }),

    bookingDate: formatDate(booking.booking_date),
    validUntil: formatDate(trip.departure),

    ageSex: "—",
    refNo: booking.reference_no,
    route: route(trip),
    tripDateEtd: formatDateTime(trip.departure),
    eta: formatTime(trip.arrival),
    vessel: orDash(trip.ship_name),
    driver: "—",
    consignee: "—",
    numberOfUnits: "1",
    plateNumber: orDash(vehicle.plateNumber),
    modelName: displayModel,
    blNumber: booking.reference_no.substring(0, 6).toUpperCase(),
    frrNumber: "—",

    freight: formatCurrency(vehicle.payment_breakdown?.base_fare ?? vehicle.baseFare ?? vehicle.price),
    discount: "—",
    freightTotal: formatCurrency(vehicle.price),
    valuation: findChargeAmount(breakdown?.charges, "QUOTE_INSURANCE"),
    withholdingTax: "—",
    docStamp: "—",
    surchargesList: formatChargeLines(nonInsuranceCharges),
    vat: formatChargeLines(breakdown?.taxes),

    grandTotal: formatCurrency(vehicle.price),
    totalOnly: formatCurrency(vehicle.price),

    termsAndConditions: "",
    salesInvoiceNote: "",
    poweredBy: "",
  };
}

// ─── Loose Cargo Ticket ───────────────────────────────────────────────────────

export function buildLooseCargoFieldValues(
  booking: BookingView,
  trip: TripDetails,
  cargo: BookingCargo,
  settings?: ShippingLineSettings | null,
): FieldValues {
  const breakdown = (cargo.payment_breakdown?.charges?.length ?? 0) > 0 || (cargo.payment_breakdown?.taxes?.length ?? 0) > 0
    ? cargo.payment_breakdown
    : booking.payment_breakdown;
  const nonInsuranceCharges = breakdown?.charges?.filter(
    (c) => c.charge_code !== "QUOTE_INSURANCE",
  );

  return {
    shippingLineName: settings?.companyName || "",
    address: settings?.registeredAddress || "",
    vatTin: settings?.vatTin
      ? `TIN: ${formatTIN(settings.vatTin, settings.branchCode)}`
      : "",
    shippingLineLogo: settings?.logoUrl || "",
    siNumber: orDash(booking.bir_invoice_no),

    qrCode: getBookingQRValue(booking, {
      cargoId: cargo.bookingTripCargoId,
    }),

    bookingDate: formatDate(booking.booking_date),
    validUntil: formatDate(trip.departure),

    ageSex: "—",
    refNo: booking.reference_no,
    route: route(trip),
    tripDateEtd: formatDateTime(trip.departure),
    eta: formatTime(trip.arrival),
    vessel: orDash(trip.ship_name),
    driver: "—",
    consignee: "—",
    numberOfUnits: String(cargo.quantity ?? 1),
    plateNumber: "—",
    modelName: orDash(cargo.description),
    blNumber: booking.reference_no.substring(0, 6).toUpperCase(),
    frrNumber: "—",

    freight: formatCurrency(cargo.payment_breakdown?.base_fare ?? cargo.baseFare ?? cargo.price),
    discount: "—",
    freightTotal: formatCurrency(cargo.price),
    valuation: findChargeAmount(breakdown?.charges, "QUOTE_INSURANCE"),
    withholdingTax: "—",
    docStamp: "—",
    surchargesList: formatChargeLines(nonInsuranceCharges),
    vat: formatChargeLines(breakdown?.taxes),

    grandTotal: formatCurrency(cargo.price),
    totalOnly: formatCurrency(cargo.price),

    termsAndConditions: "",
    salesInvoiceNote: "",
    poweredBy: "",
  };
}

// ─── Transaction summary (TMS PrintableSummary) ────────────────────────────────

export interface SummaryPassengerRow {
  name: string;
  age: string;
  sex: string;
  discountType: string;
  accommodation: string;
  route: string;
  fare: string;
  qrValue: string;
}

export interface SummaryVehicleRow {
  plateNumber: string;
  model: string;
  type: string;
  route: string;
  fare: string;
  qrValue: string;
}

export interface SummaryCargoRow {
  description: string;
  quantity: string;
  weight: string;
  route: string;
  fare: string;
  qrValue: string;
}

export interface SummaryChargeRow {
  description: string;
  amount: string;
}

export interface SummaryValues {
  referenceNo: string;
  siNumber: string;
  bookingDate: string;
  issuedBy: string;
  paymentMethod: string;
  paymentStatus: string;
  passengers: SummaryPassengerRow[];
  vehicles: SummaryVehicleRow[];
  cargo: SummaryCargoRow[];
  subtotalPassengers: string;
  subtotalVehicles: string;
  subtotalCargo: string;
  charges: SummaryChargeRow[];
  taxes: SummaryChargeRow[];
  chargesTotal: string;
  taxesTotal: string;
  grandTotal: string;
  printedAt: string;
  qrValue: string;
}

/**
 * Builds data for the fixed-layout transaction summary page (TMS copy2 / summary).
 */
export function buildSummaryValues(
  booking: BookingView,
  _settings?: ShippingLineSettings | null,
): SummaryValues {
  const allTrips = [
    ...(booking.trips?.departure ?? []),
    ...(booking.trips?.return ?? []),
  ];

  const passengers: SummaryPassengerRow[] = allTrips.flatMap((trip) =>
    (trip.passengers ?? []).map((p) => {
      const rawSex = p.sex ? String(p.sex).toLowerCase() : "";
      const sex = rawSex === "male" ? "M" : rawSex === "female" ? "F" : "—";

      const birthdayStr = p.birthday ? String(p.birthday) : "";
      const birthday = birthdayStr ? new Date(birthdayStr) : null;
      const refDate = trip.departure ? new Date(trip.departure) : new Date();
      let age = "—";
      if (birthday && !Number.isNaN(birthday.getTime())) {
        let years = refDate.getFullYear() - birthday.getFullYear();
        const m = refDate.getMonth() - birthday.getMonth();
        if (m < 0 || (m === 0 && refDate.getDate() < birthday.getDate())) years--;
        if (Number.isFinite(years)) age = String(years);
      }

      return {
        name: orDash(p.name),
        age,
        sex,
        discountType: orDash(p.discountType),
        accommodation: orDash(p.accommodation),
        route: route(trip),
        fare: formatCurrency(p.payment_breakdown?.base_fare ?? p.price),
        qrValue: getBookingQRValue(booking, {
          passengerId: getPassengerQrId(p),
        }),
      };
    }),
  );

  const vehicles: SummaryVehicleRow[] = allTrips.flatMap((trip) =>
    (trip.vehicles ?? []).map((v) => ({
      plateNumber: orDash(v.plateNumber),
      model: orDash(
        v.modelName ?? [v.make, v.model].filter(Boolean).join(" "),
      ),
      type: orDash(v.type),
      route: route(trip),
      fare: formatCurrency(v.payment_breakdown?.base_fare ?? v.price),
      qrValue: getBookingQRValue(booking, { cargoId: v.bookingTripCargoId }),
    })),
  );

  const looseRows = (trip: TripDetails) => {
    const c = trip.cargo;
    if (c && c.length > 0) return c;
    const g = trip.cargos;
    if (g && g.length > 0) return g;
    return c ?? g ?? [];
  };

  const cargo: SummaryCargoRow[] = allTrips.flatMap((trip) =>
    looseRows(trip).map((c) => ({
      description: orDash(c.description),
      quantity: String(c.quantity ?? 1),
      weight: c.unitWeight ? `${Number(c.unitWeight).toFixed(1)} kg` : "—",
      route: route(trip),
      fare: formatCurrency(c.payment_breakdown?.base_fare ?? c.price),
      qrValue: getBookingQRValue(booking, { cargoId: c.bookingTripCargoId }),
    })),
  );

  const subtotalPassengers = allTrips
    .flatMap((t) => t.passengers ?? [])
    .reduce((sum, p) => sum + Number(p.payment_breakdown?.base_fare ?? p.price ?? 0), 0);

  const subtotalVehicles = allTrips
    .flatMap((t) => t.vehicles ?? [])
    .reduce((sum, v) => sum + Number(v.payment_breakdown?.base_fare ?? v.price ?? 0), 0);

  const subtotalCargo = allTrips
    .flatMap((t) => looseRows(t))
    .reduce((sum, c) => sum + Number(c.payment_breakdown?.base_fare ?? c.price ?? 0), 0);

  const breakdown = booking.payment_breakdown;

  const charges: SummaryChargeRow[] = (breakdown?.charges ?? [])
    .filter((c) => c.amount !== 0)
    .map((c) => ({ description: c.description, amount: formatCurrency(c.amount) }));

  const taxes: SummaryChargeRow[] = (breakdown?.taxes ?? [])
    .filter((t) => t.amount !== 0)
    .map((t) => ({ description: t.description, amount: formatCurrency(t.amount) }));

  return {
    referenceNo: booking.reference_no,
    siNumber: orDash(booking.bir_invoice_no),
    bookingDate: formatDate(booking.booking_date),
    issuedBy: orDash(booking.issued_by),
    paymentMethod: orDash(booking.payment_method),
    paymentStatus: orDash(booking.payment_status),
    passengers,
    vehicles,
    cargo,
    subtotalPassengers: formatCurrency(subtotalPassengers),
    subtotalVehicles: formatCurrency(subtotalVehicles),
    subtotalCargo: formatCurrency(subtotalCargo),
    charges,
    taxes,
    chargesTotal: formatCurrency(breakdown?.charges_total ?? 0),
    taxesTotal: formatCurrency(breakdown?.taxes_total ?? 0),
    grandTotal: formatCurrency(booking.total_price),
    printedAt: new Date().toLocaleString("en-PH"),
    qrValue: getBookingQRValue(booking),
  };
}

// ─── Bill of Lading (TMS parity — one job per vehicle per trip) ─────────────

type CargoLike = BookingVehicle &
  Partial<Pick<BookingCargo, "quantity" | "unitWeight" | "weight">> & {
    measurement?: string;
    volume?: string;
  };

function formatCargoQuantity(v: CargoLike): string {
  const q = v.quantity;
  if (q != null && typeof q === "number" && q > 0) {
    return q === 1 ? "1 Unit" : `${q} Units`;
  }
  return "1 Unit";
}

function formatCargoWeight(v: CargoLike): string {
  const w = v.unitWeight ?? v.weight;
  if (w != null && typeof w === "number" && w > 0) {
    return `${w} kg`;
  }
  return "—";
}

function formatCargoMeasurement(v: CargoLike): string {
  const m = v.measurement ?? v.volume;
  if (m != null && String(m).trim() !== "") {
    return String(m).trim();
  }
  return "—";
}

/**
 * Field values for one BOL (one rolling vehicle on one trip).
 * Ported from the TMS `buildBOLFieldValues`.
 */
export function buildBOLFieldValues(
  booking: BookingView,
  trip: TripDetails,
  vehicle: BookingVehicle,
  settings?: ShippingLineSettings | null,
): FieldValues {
  const ref = booking.reference_no ?? "";
  const description = [vehicle.make, vehicle.modelName ?? vehicle.model]
    .filter(Boolean)
    .join(" ");

  return {
    shippingLineName: settings?.companyName || "",
    companyAddress: settings?.registeredAddress || "",
    companyContact: settings?.contactNumber || "",
    shippingLineLogo: settings?.logoUrl || "",
    surrenderNote: "",

    bolNumber: ref.substring(0, 6).toUpperCase() || "—",
    frrNumber: "—",

    vessel: orDash(trip.ship_name),
    voyageDate: formatDate(trip.departure),
    vgeNumber: "—",
    shipperName: orDash(booking.issued_by),
    consigneeName: "—",
    destinationBol: orDash(trip.destination),

    cargoMarks: orDash(vehicle.plateNumber),
    cargoQuantity: formatCargoQuantity(vehicle),
    cargoClassification: orDash(vehicle.type ?? vehicle.vehicleType),
    cargoDescription: orDash(description),
    cargoValue: "—",
    cargoWeight: formatCargoWeight(vehicle),
    cargoMeasurement: formatCargoMeasurement(vehicle),
    cargoCharges: formatCurrency(vehicle.price),
    totalCharges: formatCurrency(vehicle.price),
    initialIssuingClerk: "",
    loadedInHatch: "",

    issuingClerk: orDash(booking.issued_by),
    hatchNo: "",
    totalValueLabel: "",
    receiverStatement: "",
    consigneeDate: "",
    stampSignatureBox: "",
    legalTerms: "",
    carrierDate: "",
    quartermasterInitial: "",
    verifiedBy: "",
    officerOnWatchLabel: "",

    marginalDisclaimerLeft: "",
    marginalDisclaimerRight: "",
  };
}
