import { describe, expect, it } from "vitest";
import { getBookingQRValue } from "./booking-qr";

describe("getBookingQRValue", () => {
  it("returns pipe-delimited payload matching TMS (booking id only)", () => {
    expect(
      getBookingQRValue({ id: "b1", reference_no: "REF" }),
    ).toBe("b1");
  });

  it("includes passenger id segment", () => {
    expect(
      getBookingQRValue({ id: "b1", reference_no: "REF" }, { passengerId: "p9" }),
    ).toBe("b1|p9");
  });

  it("accepts legacy paxId alias", () => {
    expect(
      getBookingQRValue({ id: "b1", reference_no: "REF" }, { paxId: "p9" }),
    ).toBe("b1|p9");
  });

  it("appends cargo booking-trip id", () => {
    expect(
      getBookingQRValue({ id: "b1", reference_no: "REF" }, { cargoId: "c2" }),
    ).toBe("b1|c2");
  });
});
