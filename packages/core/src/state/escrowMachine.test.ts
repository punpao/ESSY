import { describe, expect, it } from "vitest";
import {
  canTransition,
  summarize,
  transition,
  EscrowTransitionError,
  shouldAutoRelease
} from "./escrowMachine";

describe("escrowMachine.transition", () => {
  it("moves from PENDING to HOLD when payment is held", () => {
    expect(transition("PENDING", { type: "PAYMENT_HOLD" })).toBe("HOLD");
  });

  it("throws when invalid transition attempted", () => {
    expect(() => transition("PENDING", { type: "SELLER_SHIP" })).toThrow(
      EscrowTransitionError
    );
  });

  it("allows seller to ship when funds on hold", () => {
    expect(transition("HOLD", { type: "SELLER_SHIP" })).toBe("SHIPPED");
  });

  it("allows buyer confirmation to release", () => {
    expect(transition("SHIPPED", { type: "BUYER_CONFIRM" })).toBe("RELEASED");
  });

  it("auto release leads to released", () => {
    expect(transition("SHIPPED", { type: "AUTO_RELEASE" })).toBe("RELEASED");
  });

  it("enforces dispute resolution branches", () => {
    const disputed = transition("SHIPPED", { type: "BUYER_DISPUTE" });
    expect(disputed).toBe("DISPUTE");
    expect(transition(disputed, { type: "DISPUTE_RESOLVE_REFUND" })).toBe("REFUND");
  });
});

describe("escrowMachine.canTransition", () => {
  it("reports allowed events", () => {
    expect(canTransition("HOLD", "SELLER_SHIP")).toBe(true);
    expect(canTransition("HOLD", "BUYER_CONFIRM")).toBe(false);
  });
});

describe("escrowMachine.summarize", () => {
  it("returns terminal info", () => {
    const summary = summarize("REFUND");
    expect(summary.isTerminal).toBe(true);
    expect(summary.availableEvents).toEqual([]);
  });
});

describe("escrowMachine.shouldAutoRelease", () => {
  it("returns true when auto release deadline passed", () => {
    const now = new Date();
    const autoReleaseAt = new Date(now.getTime() - 1000);
    expect(
      shouldAutoRelease({
        deliveredAt: now,
        autoReleaseAt,
        now,
        disputeOpen: false
      })
    ).toBe(true);
  });

  it("returns false when dispute is open", () => {
    const now = new Date();
    expect(
      shouldAutoRelease({
        deliveredAt: now,
        autoReleaseAt: new Date(now.getTime() - 1000),
        now,
        disputeOpen: true
      })
    ).toBe(false);
  });
});
