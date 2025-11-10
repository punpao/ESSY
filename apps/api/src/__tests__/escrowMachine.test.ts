import { describe, it, expect } from "vitest";
import { transitionEscrowState } from "@essy/core";
import type { EscrowEvent, DealStatus } from "@essy/core";

describe("Escrow State Machine", () => {
  const baseContext = {
    hasPayment: true,
    hasTracking: false,
    isDelivered: false,
    hasOpenDispute: false,
    canAutoRelease: false,
  };

  it("should transition from PENDING to HOLD on payment", () => {
    const event: EscrowEvent = { type: "PAYMENT_RECEIVED" };
    const newStatus = transitionEscrowState("PENDING", event, {
      ...baseContext,
      status: "PENDING",
      hasPayment: false,
    });
    expect(newStatus).toBe("HOLD");
  });

  it("should transition from HOLD to SHIPPED", () => {
    const event: EscrowEvent = {
      type: "SHIPPED",
      trackingNumber: "TH123",
      courier: "Kerry",
    };
    const newStatus = transitionEscrowState("HOLD", event, {
      ...baseContext,
      status: "HOLD",
    });
    expect(newStatus).toBe("SHIPPED");
  });

  it("should transition from SHIPPED to RELEASED on buyer confirmation", () => {
    const event: EscrowEvent = { type: "BUYER_CONFIRMED" };
    const newStatus = transitionEscrowState("SHIPPED", event, {
      ...baseContext,
      status: "SHIPPED",
      hasTracking: true,
    });
    expect(newStatus).toBe("RELEASED");
  });

  it("should transition to DISPUTE from HOLD", () => {
    const event: EscrowEvent = { type: "DISPUTE_OPENED" };
    const newStatus = transitionEscrowState("HOLD", event, {
      ...baseContext,
      status: "HOLD",
      hasOpenDispute: false,
    });
    expect(newStatus).toBe("DISPUTE");
  });

  it("should transition from DISPUTE to REFUND on admin resolution", () => {
    const event: EscrowEvent = { type: "ADMIN_RESOLVED_REFUND" };
    const newStatus = transitionEscrowState("DISPUTE", event, {
      ...baseContext,
      status: "DISPUTE",
      hasOpenDispute: true,
    });
    expect(newStatus).toBe("REFUND");
  });

  it("should not allow invalid transitions", () => {
    const event: EscrowEvent = { type: "BUYER_CONFIRMED" };
    const newStatus = transitionEscrowState("PENDING", event, {
      ...baseContext,
      status: "PENDING",
    });
    expect(newStatus).toBeNull();
  });

  it("should auto-release when delivered and can auto-release", () => {
    const event: EscrowEvent = { type: "AUTO_RELEASE_TRIGGERED" };
    const newStatus = transitionEscrowState("SHIPPED", event, {
      ...baseContext,
      status: "SHIPPED",
      hasTracking: true,
      isDelivered: true,
      canAutoRelease: true,
    });
    expect(newStatus).toBe("RELEASED");
  });
});
