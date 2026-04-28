/**
 * Receipt types — mirrors the subset of TMS types needed for receipt rendering.
 * Kept in sync with the TMS ticket-template and booking types.
 */

export type TicketType = "PAX_OTC" | "CARGO_OTC" | "PAX_ONLINE" | "CARGO_ONLINE";
export type FieldType = "text" | "date" | "currency" | "qr" | "image";
export type DocumentKind = "receipt" | "itinerary" | "bol";
export type CopyKey = "copy1" | "copy2";

export type RegionKey =
  | "companyHeader"
  | "qrRegion"
  | "metaRegion"
  | "detailsRegion"
  | "chargesRegion"
  | "grandTotalRegion"
  | "termsRegion"
  | "brandingRegion"
  | "bolHeaderRegion"
  | "bolShipmentRegion"
  | "bolCargoTableRegion"
  | "bolTotalsStripeRegion"
  | "bolConsigneeRegion"
  | "bolCarrierRegion"
  | "bolMarginalRegion";

export type RegionId = `${CopyKey}.${RegionKey}`;

export interface PaperConfig {
  size: string;
  marginMm: number;
}

export const THERMAL_80MM: PaperConfig = {
  size: "80mm auto",
  marginMm: 4,
} as const;

/** A4 portrait — Bill of Lading and itinerary (TMS parity). */
export const A4_PORTRAIT: PaperConfig = {
  size: "A4 portrait",
  marginMm: 10,
} as const;

export interface FieldConfig {
  visible: boolean;
  label: string;
  type?: FieldType;
  format?: Record<string, any>;
}

export interface CopyConfig {
  enabled: boolean;
  controlledByPort?: boolean;
}

export interface SurchargeSettings {
  enabled: boolean;
  defaultIncludedCodes: string[];
}

export interface TemplateSettings {
  surcharges: SurchargeSettings;
  cargoOptions: {
    withholdingTax?: { defaultIncluded: boolean };
    docStamp?: { defaultIncluded: boolean };
  } | null;
  summaryCopies?: number;
}

export interface TemplateJson {
  documentKind?: DocumentKind;
  ticketType: TicketType;
  paper: PaperConfig;
  copies: {
    copy1: CopyConfig;
    copy2: CopyConfig;
  };
  regions: Partial<Record<RegionId, string[]>>;
  fields: Record<string, FieldConfig>;
  settings: TemplateSettings;
}

export interface TicketTemplate {
  id: string;
  ticket_type: TicketType;
  template_name: string;
  version: number;
  status: string;
  template_json: TemplateJson;
  created_at: string;
  updated_at: string;
}

export const COPY1_REGIONS: RegionKey[] = [
  "companyHeader",
  "metaRegion",
  "qrRegion",
  "detailsRegion",
  "chargesRegion",
  "grandTotalRegion",
  "termsRegion",
  "brandingRegion",
];

// ─── Booking types for receipt rendering ──────────────────────────────────────

export interface PaymentBreakdownItem {
  description: string;
  charge_code: string | null;
  amount: number;
}

export interface PaymentBreakdown {
  base_fare: number;
  passengers_fare: number;
  cargo_fare: number;
  charges_total: number;
  taxes_total: number;
  charges: PaymentBreakdownItem[];
  taxes: PaymentBreakdownItem[];
}

export interface ItemPaymentBreakdown {
  base_fare: number;
  charges_total: number;
  taxes_total: number;
  charges: PaymentBreakdownItem[];
  taxes: PaymentBreakdownItem[];
  total: number;
}

export interface BookingView {
  id: string;
  reference_no: string;
  issued_by: string;
  status: string;
  bir_invoice_no: string | null;
  payment_status: string;
  booking_date: string;
  is_round_trip: boolean;
  booking_status: string;
  booking_type: string;
  source: string;
  has_passengers: boolean;
  has_cargo: boolean;
  payment_method: string | null;
  total_price: number | null;
  trips: {
    departure: TripDetails[];
    return: TripDetails[];
  };
  payment_breakdown?: PaymentBreakdown;
}

export interface TripDetails {
  id: string;
  sequence: number;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  ship_name: string;
  passengers: BookingPassenger[];
  vehicles: BookingVehicle[];
  cargo: BookingCargo[];
  /** Alias for legacy/API shapes (TMS uses `cargo ?? cargos`). */
  cargos?: BookingCargo[];
}

export interface BookingPassenger {
  id: string;
  /** Passenger entity id (preferred for QR payload parity with TMS). */
  passenger_id?: string;
  passengerId?: string;
  bookingTripPassengerId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  sex?: string | null;
  birthday?: string | null;
  discountType: string;
  accommodation: string;
  checkInStatus: string;
  checkInTime: string | null;
  bookingStatus: string;
  removedReason: string | null;
  removedReasonType: string | null;
  price?: number;
  baseFare?: number;
  payment_breakdown?: ItemPaymentBreakdown | null;
}

export interface BookingVehicle {
  id: string;
  bookingTripCargoId: string;
  plateNumber: string;
  make: string;
  model: string;
  modelName?: string;
  type: string;
  vehicleType?: string;
  vehicleTypeId?: number;
  cargoClassCode?: string;
  checkInStatus: string;
  checkInTime: string | null;
  bookingStatus: string;
  removedReason: string | null;
  removedReasonType: string | null;
  price?: number;
  baseFare?: number;
  payment_breakdown?: ItemPaymentBreakdown | null;
}

export interface BookingCargo {
  id: string;
  bookingTripCargoId: string;
  description: string;
  cargoClassCode?: string;
  unitWeight: number;
  quantity: number;
  checkInStatus: string;
  checkInTime: string | null;
  bookingStatus: string;
  removedReason: string | null;
  removedReasonType: string | null;
  price?: number;
  baseFare?: number;
  weight?: number;
  payment_breakdown?: ItemPaymentBreakdown | null;
}

export interface ShippingLineSettings {
  companyName: string | null;
  businessStyle: string | null;
  registeredAddress: string | null;
  contactNumber: string | null;
  officialEmail: string | null;
  logoUrl: string | null;
  vatTin: string | null;
  branchCode: string | null;
  birPermitNumber: string | null;
}

/** Split published templates (TMS-style receipts + optional BOL). */
export interface ReceiptTemplates {
  pax: TicketTemplate | null;
  cargo: TicketTemplate | null;
  /** Published CARGO_OTC + document_kind bol, when configured in tenant ticket_template. */
  bol?: TicketTemplate | null;
}

/** The full receipt data package returned by the API */
export interface ReceiptData {
  booking: BookingView;
  /** Legacy single template; prefer resolving via `templates` when present. */
  template: TicketTemplate | null;
  templates?: ReceiptTemplates;
  settings: ShippingLineSettings | null;
}
