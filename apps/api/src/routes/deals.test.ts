import { describe, it, expect } from "vitest";
import { validateTransition } from "@essy/core";

describe("Escrow State Machine", () => {
  it("should allow PENDING -> HOLD when payment is paid", () => {
    const result = validateTransition("PENDING", "HOLD", {
      status: "PENDING",
      paymentStatus: "PAID",
      buyerId: "buyer-123",
    });
    expect(result.valid).toBe(true);
  });

  it("should allow HOLD -> SHIPPED when tracking is added", () => {
    const result = validateTransition("HOLD", "SHIPPED", {
      status: "HOLD",
      paymentStatus: "PAID",
      trackingNumber: "TH123456789",
    });
    expect(result.valid).toBe(true);
  });

  it("should allow SHIPPED -> RELEASED when auto-release time passes", () => {
    const autoReleaseAt = new Date(Date.now() - 1000); // 1 second ago
    const result = validateTransition("SHIPPED", "RELEASED", {
      status: "SHIPPED",
      paymentStatus: "PAID",
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      autoReleaseAt,
    });
    expect(result.valid).toBe(true);
  });

  it("should allow HOLD -> DISPUTE", () => {
    const result = validateTransition("HOLD", "DISPUTE", {
      status: "HOLD",
      paymentStatus: "PAID",
      hasOpenDispute: false,
    });
    expect(result.valid).toBe(true);
  });

  it("should not allow invalid transitions", () => {
    const result = validateTransition("PENDING", "RELEASED", {
      status: "PENDING",
      paymentStatus: "INIT",
    });
    expect(result.valid).toBe(false);
  });
});
