import { describe, it, expect } from "vitest";
import { EscrowStateMachine, type DealContext } from "./escrowMachine";
import { DealStatus } from "../types";

describe("EscrowStateMachine", () => {
  it("should allow PAY transition from PENDING", () => {
    const context: DealContext = {
      status: DealStatus.PENDING,
      buyer_id: null,
      payment_paid: false,
      tracking_number: null,
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: false,
    };

    expect(EscrowStateMachine.canTransition(context, "PAY")).toBe(true);
    const result = EscrowStateMachine.transition(context, "PAY");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.HOLD);
  });

  it("should allow SHIP transition from HOLD", () => {
    const context: DealContext = {
      status: DealStatus.HOLD,
      buyer_id: "buyer123",
      payment_paid: true,
      tracking_number: null,
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: false,
    };

    expect(EscrowStateMachine.canTransition(context, "SHIP")).toBe(true);
    const result = EscrowStateMachine.transition(context, "SHIP");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.SHIPPED);
  });

  it("should allow CONFIRM transition from SHIPPED", () => {
    const context: DealContext = {
      status: DealStatus.SHIPPED,
      buyer_id: "buyer123",
      payment_paid: true,
      tracking_number: "TH123456789",
      delivered_at: new Date(),
      auto_release_at: null,
      has_open_dispute: false,
    };

    expect(EscrowStateMachine.canTransition(context, "CONFIRM")).toBe(true);
    const result = EscrowStateMachine.transition(context, "CONFIRM");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.RELEASED);
  });

  it("should allow OPEN_DISPUTE from HOLD or SHIPPED", () => {
    const context: DealContext = {
      status: DealStatus.HOLD,
      buyer_id: "buyer123",
      payment_paid: true,
      tracking_number: null,
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: false,
    };

    expect(EscrowStateMachine.canTransition(context, "OPEN_DISPUTE")).toBe(true);
    const result = EscrowStateMachine.transition(context, "OPEN_DISPUTE");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.DISPUTE);
  });

  it("should NOT allow SHIP if tracking already exists", () => {
    const context: DealContext = {
      status: DealStatus.HOLD,
      buyer_id: "buyer123",
      payment_paid: true,
      tracking_number: "TH123456789",
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: false,
    };

    expect(EscrowStateMachine.canTransition(context, "SHIP")).toBe(false);
  });

  it("should allow AUTO_RELEASE if auto_release_at has passed", () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    const context: DealContext = {
      status: DealStatus.SHIPPED,
      buyer_id: "buyer123",
      payment_paid: true,
      tracking_number: "TH123456789",
      delivered_at: new Date(),
      auto_release_at: pastDate,
      has_open_dispute: false,
    };

    expect(EscrowStateMachine.canTransition(context, "AUTO_RELEASE")).toBe(true);
    const result = EscrowStateMachine.transition(context, "AUTO_RELEASE");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.RELEASED);
  });

  it("should calculate auto_release_at correctly", () => {
    const deliveredAt = new Date("2025-01-01T10:00:00Z");
    const releaseAt = EscrowStateMachine.calculateAutoReleaseAt(deliveredAt, 48);

    expect(releaseAt.getTime()).toBe(new Date("2025-01-03T10:00:00Z").getTime());
  });

  it("should resolve dispute to REFUND", () => {
    const context: DealContext = {
      status: DealStatus.DISPUTE,
      buyer_id: "buyer123",
      payment_paid: true,
      tracking_number: "TH123456789",
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: true,
    };

    expect(EscrowStateMachine.canTransition(context, "RESOLVE_REFUND")).toBe(true);
    const result = EscrowStateMachine.transition(context, "RESOLVE_REFUND");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.REFUND);
  });

  it("should resolve dispute to RELEASED", () => {
    const context: DealContext = {
      status: DealStatus.DISPUTE,
      buyer_id: "buyer123",
      payment_paid: true,
      tracking_number: "TH123456789",
      delivered_at: null,
      auto_release_at: null,
      has_open_dispute: true,
    };

    expect(EscrowStateMachine.canTransition(context, "RESOLVE_RELEASE")).toBe(true);
    const result = EscrowStateMachine.transition(context, "RESOLVE_RELEASE");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(DealStatus.RELEASED);
  });
});
