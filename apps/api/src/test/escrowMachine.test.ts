import { describe, it, expect } from "vitest";
import {
  canTransition,
  getNextState,
  validateTransition,
  getAllowedTransitions,
} from "@essy/core";

describe("Escrow State Machine", () => {
  it("should allow PAYMENT_RECEIVED from PENDING", () => {
    expect(canTransition("PENDING", "PAYMENT_RECEIVED")).toBe(true);
    expect(getNextState("PENDING", "PAYMENT_RECEIVED")).toBe("HOLD");
  });

  it("should allow TRACKING_ADDED from HOLD", () => {
    expect(canTransition("HOLD", "TRACKING_ADDED")).toBe(true);
    expect(getNextState("HOLD", "TRACKING_ADDED")).toBe("SHIPPED");
  });

  it("should allow BUYER_CONFIRMED from SHIPPED", () => {
    expect(canTransition("SHIPPED", "BUYER_CONFIRMED")).toBe(true);
    expect(getNextState("SHIPPED", "BUYER_CONFIRMED")).toBe("RELEASED");
  });

  it("should allow AUTO_RELEASE_TRIGGERED from SHIPPED", () => {
    expect(canTransition("SHIPPED", "AUTO_RELEASE_TRIGGERED")).toBe(true);
    expect(getNextState("SHIPPED", "AUTO_RELEASE_TRIGGERED")).toBe("RELEASED");
  });

  it("should allow DISPUTE_OPENED from HOLD and SHIPPED", () => {
    expect(canTransition("HOLD", "DISPUTE_OPENED")).toBe(true);
    expect(canTransition("SHIPPED", "DISPUTE_OPENED")).toBe(true);
    expect(getNextState("HOLD", "DISPUTE_OPENED")).toBe("DISPUTE");
    expect(getNextState("SHIPPED", "DISPUTE_OPENED")).toBe("DISPUTE");
  });

  it("should allow dispute resolution from DISPUTE", () => {
    expect(canTransition("DISPUTE", "DISPUTE_RESOLVED_REFUND")).toBe(true);
    expect(canTransition("DISPUTE", "DISPUTE_RESOLVED_RELEASE")).toBe(true);
    expect(getNextState("DISPUTE", "DISPUTE_RESOLVED_REFUND")).toBe("REFUND");
    expect(getNextState("DISPUTE", "DISPUTE_RESOLVED_RELEASE")).toBe("RELEASED");
  });

  it("should not allow transitions from terminal states", () => {
    expect(canTransition("RELEASED", "BUYER_CONFIRMED")).toBe(false);
    expect(canTransition("REFUND", "DISPUTE_RESOLVED_REFUND")).toBe(false);
  });

  it("should validate transitions correctly", () => {
    const valid = validateTransition("PENDING", "PAYMENT_RECEIVED");
    expect(valid.valid).toBe(true);
    expect(valid.nextStatus).toBe("HOLD");

    const invalid = validateTransition("RELEASED", "PAYMENT_RECEIVED");
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toBeDefined();
  });

  it("should return allowed transitions", () => {
    const pendingTransitions = getAllowedTransitions("PENDING");
    expect(pendingTransitions).toContain("PAYMENT_RECEIVED");
    expect(pendingTransitions).toContain("CANCELLED");

    const shippedTransitions = getAllowedTransitions("SHIPPED");
    expect(shippedTransitions).toContain("BUYER_CONFIRMED");
    expect(shippedTransitions).toContain("AUTO_RELEASE_TRIGGERED");
    expect(shippedTransitions).toContain("DISPUTE_OPENED");
  });
});
