import { describe, it, expect } from "vitest";
import { EscrowStateMachine } from "@essy/core";

describe("EscrowStateMachine", () => {
  it("should allow valid transitions", () => {
    expect(EscrowStateMachine.canTransition("PENDING", "HOLD", { hasPayment: true })).toBe(true);
    expect(EscrowStateMachine.canTransition("HOLD", "SHIPPED", { hasTracking: true })).toBe(true);
    expect(EscrowStateMachine.canTransition("SHIPPED", "RELEASED")).toBe(true);
    expect(EscrowStateMachine.canTransition("HOLD", "DISPUTE")).toBe(true);
    expect(EscrowStateMachine.canTransition("DISPUTE", "REFUND")).toBe(true);
    expect(EscrowStateMachine.canTransition("DISPUTE", "RELEASED")).toBe(true);
  });

  it("should reject invalid transitions", () => {
    expect(EscrowStateMachine.canTransition("PENDING", "RELEASED")).toBe(false);
    expect(EscrowStateMachine.canTransition("RELEASED", "HOLD")).toBe(false);
    expect(EscrowStateMachine.canTransition("REFUND", "RELEASED")).toBe(false);
  });

  it("should validate transitions with context", () => {
    expect(() => {
      EscrowStateMachine.transition("PENDING", "HOLD", { hasPayment: false });
    }).toThrow();

    expect(() => {
      EscrowStateMachine.transition("HOLD", "SHIPPED", { hasTracking: false });
    }).toThrow();
  });

  it("should identify terminal states", () => {
    expect(EscrowStateMachine.isTerminal("RELEASED")).toBe(true);
    expect(EscrowStateMachine.isTerminal("REFUND")).toBe(true);
    expect(EscrowStateMachine.isTerminal("PENDING")).toBe(false);
  });

  it("should check auto-release eligibility", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1000);
    const future = new Date(now.getTime() + 1000);

    expect(
      EscrowStateMachine.canAutoRelease("SHIPPED", past, null)
    ).toBe(true);

    expect(
      EscrowStateMachine.canAutoRelease("SHIPPED", null, past)
    ).toBe(true);

    expect(
      EscrowStateMachine.canAutoRelease("SHIPPED", future, null)
    ).toBe(false);

    expect(
      EscrowStateMachine.canAutoRelease("HOLD", past, null)
    ).toBe(false);
  });
});
