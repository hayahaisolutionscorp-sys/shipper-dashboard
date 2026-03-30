import type { TripResult } from "@/types/booking";

const API_BASE_URL = process.env.NEXT_PUBLIC_V2_API_URL || "http://localhost:3002";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    display_name: string;
    shipper_id: string;
    shipper_name: string;
    is_primary: boolean;
  };
}

export interface ShipperAccount {
  id: string;
  shipper_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_primary: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface ShipperProfile {
  id: string;
  code: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  vehicle_type_id?: number | null;
  status: string;
  created_at: string;
  driver?: {
    id: string;
    name: string;
    phone: string | null;
    role: string;
    sex?: string | null;
    date_of_birth?: string | null;
    is_active: boolean;
  } | null;
  helper?: {
    id: string;
    name: string;
    phone: string | null;
    role: string;
    sex?: string | null;
    date_of_birth?: string | null;
    is_active: boolean;
  } | null;
}

export interface Personnel {
  id: string;
  name: string;
  phone: string | null;
  role: "driver" | "helper";
  sex?: "male" | "female" | null;
  date_of_birth?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VehicleType {
  id: number;
  name: string;
}

export interface ShipperRate {
  vehicle_type_id: number;
  vehicle_type_name: string;
  amount: string;
  currency: string;
}

export interface AssignedRoute {
  tenant_id: number;
  tenant_name: string;
  route_id: number;
  tenant_route_id: number;
  src_port_code: string;
  src_port_name: string;
  dest_port_code: string;
  dest_port_name: string;
  route_code: string;
  rates?: ShipperRate[];
  rate?: {
    amount: string;
    currency: string;
  };
}

/** Maps the ConnectingTripDto shape returned by the v2 API onto the flat TripResult the UI consumes */
function mapConnectingTripToTripResult(raw: any): TripResult {
  const firstSegment = raw.segments?.[0];
  const departure = new Date(raw.total_departure_time);
  const arrival = new Date(raw.total_arrival_time);
  const pad = (n: number) => String(n).padStart(2, "0");
  const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return {
    id: raw.id,
    trip_segment_id: firstSegment?.id ?? raw.id,
    vessel_name: firstSegment?.ship_name ?? "Unknown Vessel",
    departure_date: toDateStr(departure),
    departure_time: toTimeStr(departure),
    arrival_date: toDateStr(arrival),
    arrival_time: toTimeStr(arrival),
    src_port_name: raw.origin_name ?? "",
    dest_port_name: raw.destination_name ?? "",
    available_vehicle_capacity: 0,
    status: "available",
    shipping_line_name: raw.tenant_name,
    tenant_id: raw.tenant_id ?? 0,
    tenant_name: raw.tenant_name ?? "",
    type: raw.type ?? "direct",
    segment_count: raw.segment_count ?? 1,
  };
}

class AuthService {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  private clearAuth() {
    localStorage.removeItem("shipper_data");
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/shipper-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Invalid credentials");
    }

    const responseBody = await response.json();
    // Backend wraps all responses in { status, message, data }
    const data: LoginResponse = responseBody.data ?? responseBody;
    // Store user info only (tokens are in httpOnly cookies set by the API)
    localStorage.setItem("shipper_data", JSON.stringify({
      shipper: {
        id: data.user.shipper_id,
        name: data.user.shipper_name,
      },
      account: {
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.display_name,
        is_primary: data.user.is_primary ?? false,
      },
    }));
    return data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/shipper-auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      this.clearAuth();
    }
  }

  getStoredData(): {
    shipper: { id: string; name: string };
    account: { id: string; email: string; display_name: string; is_primary: boolean };
  } | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem("shipper_data");
    return data ? JSON.parse(data) : null;
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("shipper_data");
  }

  /**
   * Verify the session is still valid server-side by hitting the verify-token endpoint.
   * Clears local auth state and returns false if the token has expired.
   * Use this on app init or after a period of inactivity.
   */
  async verifySession(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/shipper-auth/verify-token`, {
        credentials: "include",
      });
      if (!response.ok) {
        this.clearAuth();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempt to refresh the access token using the refresh token cookie.
   * Returns true if refresh succeeded, false otherwise.
   * Uses a singleton pattern so multiple concurrent 401s only trigger one refresh.
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shipper-auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        // API sets new httpOnly cookies on success — we just need a 200 OK
        return response.ok;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}, isRetry = false): Promise<any> {
    if (!this.isAuthenticated()) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401 && !isRetry) {
      // Attempt token refresh (API handles cookies automatically)
      const refreshed = await this.attemptTokenRefresh();
      if (refreshed) {
        // Retry the original request with the new cookie
        return this.fetchWithAuth(url, options, true);
      }

      // Refresh failed — session is truly expired
      this.clearAuth();
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    if (response.status === 401 && isRetry) {
      // Already retried after refresh — give up
      this.clearAuth();
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || "Request failed");
    }

    const responseBody = await response.json();
    // Backend wraps all responses in { status, message, data }
    return responseBody.data ?? responseBody;
  }

  // ============ Profile ============

  async getProfile(): Promise<ShipperProfile> {
    return this.fetchWithAuth("/my-shipper");
  }

  // ============ Vehicle Types ============

  async getVehicleTypes(): Promise<VehicleType[]> {
    return this.fetchWithAuth("/my-shipper/vehicle-types");
  }

  // ============ Vehicles ============

  async getVehicles(): Promise<Vehicle[]> {
    return this.fetchWithAuth("/my-shipper/vehicles");
  }

  async createVehicle(data: { plate_number: string; vehicle_type: string; vehicle_type_id?: number | null }): Promise<Vehicle> {
    return this.fetchWithAuth("/my-shipper/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.fetchWithAuth(`/my-shipper/vehicles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.fetchWithAuth(`/my-shipper/vehicles/${id}`, { method: "DELETE" });
  }

  // ============ Personnel ============

  async getPersonnel(): Promise<Personnel[]> {
    return this.fetchWithAuth("/my-shipper/personnel");
  }

  async createPersonnel(data: { name: string; phone?: string; role: "driver" | "helper" }): Promise<Personnel> {
    return this.fetchWithAuth("/my-shipper/personnel", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePersonnel(id: string, data: Partial<Personnel>): Promise<Personnel> {
    return this.fetchWithAuth(`/my-shipper/personnel/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePersonnel(id: string): Promise<void> {
    return this.fetchWithAuth(`/my-shipper/personnel/${id}`, { method: "DELETE" });
  }

  // ============ Routes ============

  async getRoutes(): Promise<AssignedRoute[]> {
    const data = await this.fetchWithAuth("/my-shipper/routes");
    // Backend returns { routes: [...] }
    return Array.isArray(data) ? data : (data?.routes ?? []);
  }

  // ============ Stats ============

  async getStats(): Promise<{
    active_vehicles: number;
    total_personnel: number;
    drivers: number;
    helpers: number;
    assigned_routes: number;
    partner_lines: number;
  }> {
    return this.fetchWithAuth("/my-shipper/stats");
  }

  // ============ Vehicle-Personnel Assignment ============

  async assignDriver(vehicleId: string, personnelId: string): Promise<void> {
    return this.fetchWithAuth(`/my-shipper/vehicles/${vehicleId}/assign-driver`, {
      method: "POST",
      body: JSON.stringify({ personnel_id: personnelId }),
    });
  }

  async assignHelper(vehicleId: string, personnelId: string): Promise<void> {
    return this.fetchWithAuth(`/my-shipper/vehicles/${vehicleId}/assign-helper`, {
      method: "POST",
      body: JSON.stringify({ personnel_id: personnelId }),
    });
  }

  async removeDriver(vehicleId: string): Promise<void> {
    return this.fetchWithAuth(`/my-shipper/vehicles/${vehicleId}/driver`, {
      method: "DELETE",
    });
  }

  async removeHelper(vehicleId: string): Promise<void> {
    return this.fetchWithAuth(`/my-shipper/vehicles/${vehicleId}/helper`, {
      method: "DELETE",
    });
  }

  // ============ Bookings (Fan-out) ============

  async getBookings(filters?: {
    from?: string;
    to?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<BookingsResponse> {
    const params = new URLSearchParams();
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));
    const qs = params.toString();
    return this.fetchWithAuth(`/my-shipper/bookings${qs ? `?${qs}` : ""}`);
  }

  async getBookingById(id: string): Promise<Booking | null> {
    try {
      return await this.fetchWithAuth(`/my-shipper/bookings/${id}`);
    } catch {
      return null;
    }
  }

  async getBookingStats(): Promise<BookingStats> {
    return this.fetchWithAuth("/my-shipper/booking-stats");
  }

  // ============ Password Reset ============

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/shipper-auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || "Failed to send reset code");
    }

    const responseBody = await response.json();
    return responseBody.data ?? responseBody;
  }

  async verifyResetCode(email: string, code: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/shipper-auth/verify-reset-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Verification failed" }));
      throw new Error(error.message || "Invalid verification code");
    }

    const responseBody = await response.json();
    return responseBody.data ?? responseBody;
  }

  async resetPassword(email: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/shipper-auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, new_password: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Reset failed" }));
      throw new Error(error.message || "Failed to reset password");
    }

    const responseBody = await response.json();
    return responseBody.data ?? responseBody;
  }

  // ============ Trip Search ============

  async searchTrips(params: {
    origin_code: string;
    destination_code: string;
    departure_date: string;
    passenger_count?: number;
    vehicle_count?: number;
  }): Promise<TripResult[]> {
    const qs = new URLSearchParams({
      origin_code: params.origin_code,
      destination_code: params.destination_code,
      departure_date: params.departure_date,
      passenger_count: String(params.passenger_count ?? 1),
      vehicle_count: String(params.vehicle_count ?? 1),
      page: "1",
      sort: "departureDate",
    });
    const raw: any[] = await this.fetchWithAuth(`/my-shipper/trips?${qs}`);
    const results = Array.isArray(raw) ? raw : [];
    const mapped = results.map(mapConnectingTripToTripResult);
    // Deduplicate by id — the multi-tenant fan-out can return the same trip from
    // multiple tenants, which causes React duplicate-key warnings.
    const seen = new Set<string>();
    return mapped.filter((trip) => {
      if (seen.has(trip.id)) return false;
      seen.add(trip.id);
      return true;
    });
  }

  // ============ Team / Account Management ============

  async getAccounts(): Promise<ShipperAccount[]> {
    return this.fetchWithAuth("/my-shipper/accounts");
  }

  async createAccount(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }): Promise<ShipperAccount> {
    return this.fetchWithAuth("/my-shipper/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deactivateAccount(id: string): Promise<ShipperAccount> {
    return this.fetchWithAuth(`/my-shipper/accounts/${id}`, {
      method: "DELETE",
    });
  }

  async reactivateAccount(id: string): Promise<ShipperAccount> {
    return this.fetchWithAuth(`/my-shipper/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: true }),
    });
  }

  // ============ Credits ============

  async getCreditBalance(): Promise<{ balance: number }> {
    return this.fetchWithAuth("/my-shipper/credits");
  }

  async topUpCredits(amount: number): Promise<{ balance: number; transaction_id: string }> {
    return this.fetchWithAuth("/my-shipper/credits/top-up", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  async getCreditTransactions(filters?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<{
    data: Array<{
      id: string;
      shipper_id: string;
      type: string;
      amount: number;
      balance_after: number;
      description: string | null;
      reference_id: string | null;
      created_by: string | null;
      created_at: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));
    if (filters?.type) params.set("type", filters.type);
    const qs = params.toString();
    const result = await this.fetchWithAuth(`/my-shipper/credits/transactions${qs ? `?${qs}` : ""}`);
    // Backend returns { transactions, total } — normalize to { data, total, limit, offset }
    return {
      data: result.transactions ?? result.data ?? [],
      total: result.total ?? 0,
      limit: filters?.limit ?? 20,
      offset: filters?.offset ?? 0,
    };
  }

  // ============ Booking Creation ============

  async createBooking(payload: {
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
        sex?: string | null;
        date_of_birth?: string | null;
      } | null;
      helpers: {
        id: string;
        name: string;
        phone: string | null;
        sex?: string | null;
        date_of_birth?: string | null;
      }[];
    }[];
    payment_method: string;
    remarks?: string;
  }): Promise<{ id: string; reference_no: string; booking_status: string }> {
    const result = await this.fetchWithAuth("/my-shipper/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    // Response: { total_vehicles, successful, bookings: [{data:{data:"<uuid>"}}], booking_status }
    // reference_no is not returned by this endpoint — only available via GET /bookings
    const id = result?.bookings?.[0]?.data?.data ?? "";
    return {
      id,
      reference_no: "",
      booking_status: result?.booking_status ?? "",
    };
  }

  async retryBooking(payload: {
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
        sex?: string | null;
        date_of_birth?: string | null;
      } | null;
      helpers: {
        id: string;
        name: string;
        phone: string | null;
        sex?: string | null;
        date_of_birth?: string | null;
      }[];
    }[];
    payment_method: string;
    remarks?: string;
  }): Promise<{ id: string; reference_no: string; booking_status: string }> {
    const result = await this.fetchWithAuth("/my-shipper/bookings/retry", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return result?.booking ?? result;
  }
}

export interface Booking {
  id: string;
  reference_no: string;
  booking_status: string;
  booking_type: string;
  payment_method: string | null;
  created_at: string;
  shipper_vehicle_plate: string | null;
  shipper_driver_name: string | null;
  shipper_helper_name: string | null;
  shipper_rate_amount: string | null;
  shipper_rate_currency: string | null;
  has_cargo: boolean;
  has_passengers: boolean;
  scheduled_departure: string | null;
  scheduled_arrival: string | null;
  route_code: string | null;
  src_port_name: string | null;
  src_port_code: string | null;
  dest_port_name: string | null;
  dest_port_code: string | null;
  tenant_id: number;
  tenant_name: string;
}

export interface BookingsResponse {
  bookings: Booking[];
  total: number;
  stats: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    total_revenue: number;
  };
  tenants: {
    tenant_id: number;
    tenant_name: string;
    booking_count: number;
    status: string;
  }[];
}

export interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  total_revenue: number;
  revenue_by_route: { route: string; revenue: number; count: number }[];
  bookings_by_month: { month: string; count: number }[];
  tenants: {
    tenant_id: number;
    tenant_name: string;
    booking_count: number;
    status: string;
  }[];
}

export const authService = new AuthService();
