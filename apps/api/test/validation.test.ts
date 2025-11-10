import { describe, expect, it } from "vitest";
import { createDealSchema, shipSchema } from "../src/routes/deals";

describe("API input validation", () => {
  it("rejects invalid deal titles", () => {
    expect(() => createDealSchema.parse({ title: "ok", amountTHB: -10 })).toThrow();
  });

  it("requires positive amount", () => {
    expect(() =>
      createDealSchema.parse({
        title: "รองเท้า Nike มือสอง",
        amountTHB: -1
      })
    ).toThrow();
  });

  it("parses valid shipment payload", () => {
    const parsed = shipSchema.parse({
      trackingNumber: "TH12345",
      courier: "THAI POST",
      deliveredAt: new Date().toISOString()
    });
    expect(parsed.courier).toContain("THAI");
  });
});
