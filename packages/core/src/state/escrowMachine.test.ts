import { describe, expect, it } from "vitest";
import { computeAutoReleaseAt, transitionEscrowState } from "./escrowMachine";

describe("escrowMachine", () => {
  it("transitions pending -> hold", () => {
    const next = transitionEscrowState(
      "PENDING",
      { type: "PAYMENT_HOLD" },
      { hasPayment: true }
    );
    expect(next).toBe("HOLD");
  });

  it("prevents cancelling after payment", () => {
    expect(() =>
      transitionEscrowState("PENDING", { type: "CANCEL" }, { hasPayment: true })
    ).toThrow();
  });

  it("allows shipping after hold", () => {
    const next = transitionEscrowState("HOLD", { type: "SHIP" }, { hasPayment: true });
    expect(next).toBe("SHIPPED");
  });

  it("auto-releases when overdue", () => {
    const deliveredAt = new Date(Date.now() - 1000 * 60 * 60 * 49);
    const autoReleaseAt = computeAutoReleaseAt(deliveredAt);
    const next = transitionEscrowState(
      "SHIPPED",
      { type: "AUTO_RELEASE" },
      {
        hasPayment: true,
        deliveredAt,
        autoReleaseAt,
        now: new Date(),
        hasOpenDispute: false
      }
    );
    expect(next).toBe("RELEASED");
  });

  it("rejects auto-release when dispute exists", () => {
    const deliveredAt = new Date(Date.now() - 1000 * 60 * 60 * 49);
    const autoReleaseAt = computeAutoReleaseAt(deliveredAt);
    expect(() =>
      transitionEscrowState(
        "SHIPPED",
        { type: "AUTO_RELEASE" },
        {
          hasPayment: true,
          deliveredAt,
          autoReleaseAt,
          now: new Date(),
          hasOpenDispute: true
        }
      )
    ).toThrow();
  });
});
