/**
 * Booking QR encoding — aligned with the TMS booking QR implementation.
 * Pipe-delimited payload (no URL) so printed receipts match TMS scanners.
 */

interface QRParams {
  bookingId: string;
  passengerId?: string;
  /** @deprecated Use passengerId */
  paxId?: string;
  cargoId?: string;
  intent?: "verify" | "checkin";
}

/**
 * Value encoded in booking QR codes.
 * Format:
 * - Booking summary: bookingUuid
 * - Passenger/Cargo QR: bookingUuid|entityUuid (and optional intent)
 */
export function getBookingQRValue(
  booking: { id?: string; reference_no: string } | null | undefined,
  options?: Partial<QRParams>,
): string {
  if (!booking?.id) return "";
  const passengerId = options?.passengerId ?? options?.paxId;
  const payload: string[] = [booking.id];

  if (passengerId) {
    payload.push(passengerId);
  }
  if (options?.cargoId) {
    payload.push(options.cargoId);
  }
  if (options?.intent) {
    payload.push(options.intent);
  }

  return payload.join("|");
}
