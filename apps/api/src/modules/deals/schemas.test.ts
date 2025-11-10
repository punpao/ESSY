import { describe, expect, it } from "vitest";
import { createDealSchema, shipDealSchema } from "./schemas";

describe("deal schemas", () => {
  it("rejects invalid amount", () => {
    expect(() =>
      createDealSchema.parse({
        title: "ของดี",
        amount_thb: 0,
        expires_in_hours: 24
      })
    ).toThrow();
  });

  it("requires tracking number on ship", () => {
    expect(() =>
      shipDealSchema.parse({
        courier: "Flash"
      })
    ).toThrow();
  });

  it("parses valid shipping payload", () => {
    const result = shipDealSchema.parse({
      tracking_number: "TH1234567890",
      courier: "Kerry"
    });
    expect(result.courier).toBe("Kerry");
  });
});
