import { describe, it, expect } from "vitest";
import { EscrowStateMachine, DealStatus } from "@thai-escrow/core";

describe("Deal State Transitions", () => {
  it("should transition from PENDING to HOLD on payment", () => {
    const context = {
      status: DealStatus.PENDING,
      buyer_id: null,
      payment_paid: false,
      tracking_number: null,
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: false,
    };

    const result = EscrowStateMachine.transition(context, "PAY");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.HOLD);
  });

  it("should transition from HOLD to SHIPPED when tracking is added", () => {
    const context = {
      status: DealStatus.HOLD,
      buyer_id: "buyer-123",
      payment_paid: true,
      tracking_number: null,
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: false,
    };

    const result = EscrowStateMachine.transition(context, "SHIP");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.SHIPPED);
  });

  it("should transition from SHIPPED to RELEASED on buyer confirmation", () => {
    const context = {
      status: DealStatus.SHIPPED,
      buyer_id: "buyer-123",
      payment_paid: true,
      tracking_number: "TH123456",
      delivered_at: new Date(),
      auto_release_at: null,
      has_open_dispute: false,
    };

    const result = EscrowStateMachine.transition(context, "CONFIRM");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.RELEASED);
  });

  it("should NOT allow SHIP if tracking already exists", () => {
    const context = {
      status: DealStatus.HOLD,
      buyer_id: "buyer-123",
      payment_paid: true,
      tracking_number: "TH123456",
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: false,
    };

    const result = EscrowStateMachine.transition(context, "SHIP");
    expect(result.success).toBe(false);
  });

  it("should NOT allow CONFIRM if there is an open dispute", () => {
    const context = {
      status: DealStatus.SHIPPED,
      buyer_id: "buyer-123",
      payment_paid: true,
      tracking_number: "TH123456",
      delivered_at: new Date(),
      auto_release_at: null,
      has_open_dispute: true,
    };

    const result = EscrowStateMachine.transition(context, "CONFIRM");
    expect(result.success).toBe(false);
  });
});
