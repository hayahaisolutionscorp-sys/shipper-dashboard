import type { AssignedRoute, Personnel, Vehicle } from "@/services/auth.service";

// ============ Trip Search ============

export interface TripSearchParams {
  origin_code: string;
  destination_code: string;
  departure_date: string;
  passenger_count?: number;
  vehicle_count?: number;
}

export interface TripResult {
  /** Composite ID from the API (e.g. "direct-<uuid>") — safe to use as a React key */
  id: string;
  /** The actual trip segment UUID to send in the booking payload */
  trip_segment_id: string;
  vessel_name: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  src_port_name: string;
  dest_port_name: string;
  available_vehicle_capacity: number;
  status: string;
  shipping_line_name?: string;
  tenant_id: number;
  tenant_name: string;
  type: "direct" | "connecting";
  segment_count: number;
}

// ============ Vehicle Entry for Booking ============

export interface BookingVehicleEntry {
  vehicle: Vehicle;
  driver: Personnel | null;
  helpers: Personnel[];
  /** Vehicle type name chosen from the tenant's list — overrides vehicle.vehicle_type in the booking payload */
  vehicle_type_override?: string;
  /** Vehicle type ID corresponding to the override selection */
  vehicle_type_id_override?: number;
}

// ============ Create Booking Payload ============

export interface CreateShipperBookingPayload {
  tenant_id: number;
  trip_id: string;
  route_code: string;
  vehicles: {
    vehicle_id: string;
    plate_number: string;
    vehicle_type: string;
    vehicle_type_id?: number | null;
    driver?: {
      id: string;
      name: string;
      phone: string | null;
    } | null;
    helpers: {
      id: string;
      name: string;
      phone: string | null;
    }[];
  }[];
  payment_method: string;
  remarks?: string;
}

// ============ Create Booking Response ============

export interface CreateBookingResponse {
  id: string;
  reference_no: string;
  booking_status: string;
  created_at: string;
}

// ============ Booking Steps ============

export type BookingStep = "route" | "trip" | "vehicles" | "review";

export const BOOKING_STEPS: { key: BookingStep; label: string; number: number }[] = [
  { key: "route", label: "Select Route", number: 1 },
  { key: "trip", label: "Find Trip", number: 2 },
  { key: "vehicles", label: "Add Vehicles", number: 3 },
  { key: "review", label: "Review & Book", number: 4 },
];
