import type { DealStatus, DealTransition } from "../types";

/**
 * Escrow State Machine
 * Valid transitions:
 * - PENDING -> HOLD (payment received)
 * - HOLD -> SHIPPED (seller adds tracking)
 * - SHIPPED -> RELEASED (buyer confirms OR auto-release after delivery)
 * - HOLD -> DISPUTE (buyer opens dispute before shipping)
 * - SHIPPED -> DISPUTE (buyer opens dispute after shipping)
 * - DISPUTE -> REFUND (admin resolves with refund)
 * - DISPUTE -> RELEASED (admin resolves with release)
 * - PENDING -> (cancelled, not a status)
 */
export class EscrowStateMachine {
  /**
   * Check if a transition is valid
   */
  static canTransition(
    from: DealStatus,
    to: DealStatus,
    context?: {
      hasPayment?: boolean;
      hasTracking?: boolean;
      hasDispute?: boolean;
    }
  ): boolean {
    // Same state is always valid (idempotent)
    if (from === to) return true;

    // Define valid transitions
    const validTransitions: Record<DealStatus, DealStatus[]> = {
      PENDING: ["HOLD", "DISPUTE"], // Can go to HOLD (paid) or DISPUTE (if paid then disputed)
      HOLD: ["SHIPPED", "DISPUTE", "RELEASED"], // Can ship, dispute, or auto-release
      SHIPPED: ["RELEASED", "DISPUTE"], // Can confirm receipt or dispute
      RELEASED: [], // Terminal state
      DISPUTE: ["REFUND", "RELEASED"], // Admin can resolve
      REFUND: [], // Terminal state
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Get valid next states from current state
   */
  static getNextStates(
    current: DealStatus,
    context?: {
      hasPayment?: boolean;
      hasTracking?: boolean;
      hasDispute?: boolean;
    }
  ): DealStatus[] {
    const transitions: Record<DealStatus, DealStatus[]> = {
      PENDING: ["HOLD", "DISPUTE"],
      HOLD: ["SHIPPED", "DISPUTE", "RELEASED"],
      SHIPPED: ["RELEASED", "DISPUTE"],
      RELEASED: [],
      DISPUTE: ["REFUND", "RELEASED"],
      REFUND: [],
    };

    return transitions[current] || [];
  }

  /**
   * Validate and apply transition
   */
  static transition(
    from: DealStatus,
    to: DealStatus,
    context?: {
      hasPayment?: boolean;
      hasTracking?: boolean;
      hasDispute?: boolean;
    }
  ): DealTransition {
    if (!this.canTransition(from, to, context)) {
      throw new Error(
        `Invalid transition from ${from} to ${to}. Valid next states: ${this.getNextStates(from, context).join(", ")}`
      );
    }

    // Additional context-based validation
    if (to === "HOLD" && !context?.hasPayment) {
      throw new Error("Cannot transition to HOLD without payment");
    }

    if (to === "SHIPPED" && !context?.hasTracking) {
      throw new Error("Cannot transition to SHIPPED without tracking");
    }

    return { from, to };
  }

  /**
   * Check if state is terminal
   */
  static isTerminal(state: DealStatus): boolean {
    return state === "RELEASED" || state === "REFUND";
  }

  /**
   * Check if auto-release is allowed
   */
  static canAutoRelease(
    status: DealStatus,
    deliveredAt: Date | null,
    autoReleaseAt: Date | null
  ): boolean {
    if (status !== "SHIPPED") return false;
    if (!deliveredAt && !autoReleaseAt) return false;

    const now = new Date();
    if (deliveredAt && now >= deliveredAt) return true;
    if (autoReleaseAt && now >= autoReleaseAt) return true;

    return false;
  }
}
