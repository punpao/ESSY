/**
 * Escrow State Machine
 * 
 * State Flow:
 * PENDING → HOLD → SHIPPED → RELEASED
 * 
 * Branches:
 * HOLD/SHIPPED/RELEASED → DISPUTE → (REFUND | RELEASED)
 * 
 * Rules:
 * - Only seller can create deal (PENDING)
 * - Payment webhook transitions PENDING → HOLD
 * - Seller can add tracking: HOLD → SHIPPED
 * - Buyer confirms OR auto-release: SHIPPED → RELEASED
 * - Buyer can open dispute from HOLD/SHIPPED (before RELEASED)
 * - Admin resolves disputes to REFUND or RELEASED
 */

import { DealStatus, type DealStatusType } from "../types";

export interface DealContext {
  status: DealStatusType;
  buyer_id: string | null;
  payment_paid: boolean;
  tracking_number: string | null;
  delivered_at: Date | null;
  auto_release_at: Date | null;
  has_open_dispute: boolean;
}

export type DealTransition =
  | "PAY"
  | "SHIP"
  | "CONFIRM"
  | "AUTO_RELEASE"
  | "OPEN_DISPUTE"
  | "RESOLVE_REFUND"
  | "RESOLVE_RELEASE"
  | "CANCEL";

export interface TransitionResult {
  success: boolean;
  newStatus?: DealStatusType;
  error?: string;
}

/**
 * State machine guards and transitions
 */
export class EscrowStateMachine {
  /**
   * Check if a transition is valid from current state
   */
  static canTransition(context: DealContext, transition: DealTransition): boolean {
    const { status, payment_paid, tracking_number, has_open_dispute } = context;

    switch (transition) {
      case "PAY":
        return status === DealStatus.PENDING && !payment_paid;

      case "SHIP":
        return status === DealStatus.HOLD && tracking_number === null && !has_open_dispute;

      case "CONFIRM":
        return (
          (status === DealStatus.SHIPPED || status === DealStatus.HOLD) && !has_open_dispute
        );

      case "AUTO_RELEASE":
        return (
          (status === DealStatus.SHIPPED || status === DealStatus.HOLD) &&
          !has_open_dispute &&
          context.auto_release_at !== null &&
          new Date() >= context.auto_release_at
        );

      case "OPEN_DISPUTE":
        return (
          (status === DealStatus.HOLD || status === DealStatus.SHIPPED) &&
          !has_open_dispute &&
          context.buyer_id !== null
        );

      case "RESOLVE_REFUND":
        return status === DealStatus.DISPUTE && has_open_dispute;

      case "RESOLVE_RELEASE":
        return status === DealStatus.DISPUTE && has_open_dispute;

      case "CANCEL":
        return status === DealStatus.PENDING && !payment_paid;

      default:
        return false;
    }
  }

  /**
   * Execute a transition and return the new status
   */
  static transition(context: DealContext, transition: DealTransition): TransitionResult {
    if (!this.canTransition(context, transition)) {
      return {
        success: false,
        error: `Cannot transition from ${context.status} with action ${transition}`,
      };
    }

    let newStatus: DealStatusType;

    switch (transition) {
      case "PAY":
        newStatus = DealStatus.HOLD;
        break;

      case "SHIP":
        newStatus = DealStatus.SHIPPED;
        break;

      case "CONFIRM":
      case "AUTO_RELEASE":
        newStatus = DealStatus.RELEASED;
        break;

      case "OPEN_DISPUTE":
        newStatus = DealStatus.DISPUTE;
        break;

      case "RESOLVE_REFUND":
        newStatus = DealStatus.REFUND;
        break;

      case "RESOLVE_RELEASE":
        newStatus = DealStatus.RELEASED;
        break;

      case "CANCEL":
        // Could add a CANCELLED status, but for MVP we just delete or mark
        newStatus = DealStatus.PENDING;
        break;

      default:
        return { success: false, error: "Unknown transition" };
    }

    return { success: true, newStatus };
  }

  /**
   * Calculate auto-release timestamp (48 hours from delivery)
   */
  static calculateAutoReleaseAt(deliveredAt: Date, autoReleaseHours: number = 48): Date {
    const releaseAt = new Date(deliveredAt);
    releaseAt.setHours(releaseAt.getHours() + autoReleaseHours);
    return releaseAt;
  }

  /**
   * Get all valid transitions from current state
   */
  static getValidTransitions(context: DealContext): DealTransition[] {
    const allTransitions: DealTransition[] = [
      "PAY",
      "SHIP",
      "CONFIRM",
      "AUTO_RELEASE",
      "OPEN_DISPUTE",
      "RESOLVE_REFUND",
      "RESOLVE_RELEASE",
      "CANCEL",
    ];

    return allTransitions.filter((t) => this.canTransition(context, t));
  }
}
