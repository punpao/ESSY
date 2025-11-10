import type { DealStatus } from "../types";

export type EscrowEvent =
  | { type: "PAYMENT_RECEIVED" }
  | { type: "SHIPPED"; trackingNumber: string; courier: string }
  | { type: "DELIVERED" }
  | { type: "BUYER_CONFIRMED" }
  | { type: "DISPUTE_OPENED" }
  | { type: "AUTO_RELEASE_TRIGGERED" }
  | { type: "ADMIN_RESOLVED_REFUND" }
  | { type: "ADMIN_RESOLVED_RELEASE" }
  | { type: "CANCELLED" };

export interface EscrowContext {
  status: DealStatus;
  hasPayment: boolean;
  hasTracking: boolean;
  isDelivered: boolean;
  hasOpenDispute: boolean;
  canAutoRelease: boolean;
}

/**
 * Pure state machine for escrow transitions.
 * Returns the new status or null if transition is invalid.
 */
export function transitionEscrowState(
  currentStatus: DealStatus,
  event: EscrowEvent,
  context: EscrowContext
): DealStatus | null {
  // Exhaustive state machine with guards
  switch (currentStatus) {
    case "PENDING":
      if (event.type === "PAYMENT_RECEIVED") {
        return "HOLD";
      }
      if (event.type === "CANCELLED") {
        return "PENDING"; // Stay pending, just mark as cancelled in metadata
      }
      return null;

    case "HOLD":
      if (event.type === "SHIPPED") {
        return "SHIPPED";
      }
      if (event.type === "DISPUTE_OPENED") {
        return "DISPUTE";
      }
      if (event.type === "CANCELLED") {
        // Can only cancel if no payment yet
        if (!context.hasPayment) {
          return "PENDING";
        }
        return null;
      }
      return null;

    case "SHIPPED":
      if (event.type === "BUYER_CONFIRMED") {
        return "RELEASED";
      }
      if (event.type === "DELIVERED") {
        // Auto-release if delivered and can auto-release
        if (context.canAutoRelease) {
          return "RELEASED";
        }
        return "SHIPPED"; // Stay shipped, but mark delivered
      }
      if (event.type === "AUTO_RELEASE_TRIGGERED") {
        if (context.canAutoRelease && context.isDelivered) {
          return "RELEASED";
        }
        return null;
      }
      if (event.type === "DISPUTE_OPENED") {
        return "DISPUTE";
      }
      return null;

    case "RELEASED":
      // Terminal state - no transitions allowed
      return null;

    case "DISPUTE":
      if (event.type === "ADMIN_RESOLVED_REFUND") {
        return "REFUND";
      }
      if (event.type === "ADMIN_RESOLVED_RELEASE") {
        return "RELEASED";
      }
      return null;

    case "REFUND":
      // Terminal state - no transitions allowed
      return null;

    default:
      // Exhaustive check
      const _exhaustive: never = currentStatus;
      return _exhaustive;
  }
}

/**
 * Check if a transition is valid without applying it
 */
export function canTransition(
  currentStatus: DealStatus,
  event: EscrowEvent,
  context: EscrowContext
): boolean {
  return transitionEscrowState(currentStatus, event, context) !== null;
}

/**
 * Get all valid next events for a given state
 */
export function getValidEvents(
  status: DealStatus,
  context: EscrowContext
): EscrowEvent["type"][] {
  const valid: EscrowEvent["type"][] = [];

  switch (status) {
    case "PENDING":
      valid.push("PAYMENT_RECEIVED", "CANCELLED");
      break;
    case "HOLD":
      valid.push("SHIPPED", "DISPUTE_OPENED");
      if (!context.hasPayment) {
        valid.push("CANCELLED");
      }
      break;
    case "SHIPPED":
      valid.push("BUYER_CONFIRMED", "DELIVERED", "AUTO_RELEASE_TRIGGERED", "DISPUTE_OPENED");
      break;
    case "RELEASED":
      // Terminal
      break;
    case "DISPUTE":
      valid.push("ADMIN_RESOLVED_REFUND", "ADMIN_RESOLVED_RELEASE");
      break;
    case "REFUND":
      // Terminal
      break;
  }

  return valid;
}
