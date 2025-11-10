import type { DealStatus } from '../types';

/**
 * Escrow State Machine
 * 
 * Valid transitions:
 * - PENDING → HOLD (payment received)
 * - HOLD → SHIPPED (seller adds tracking)
 * - SHIPPED → RELEASED (buyer confirms OR auto-release after delivery)
 * - HOLD → DISPUTE (buyer opens dispute)
 * - SHIPPED → DISPUTE (buyer opens dispute)
 * - DISPUTE → REFUND (admin resolves)
 * - DISPUTE → RELEASED (admin resolves)
 * - PENDING → (cancelled, not a status)
 */
export class EscrowStateMachine {
  /**
   * Check if a transition is valid
   */
  static canTransition(from: DealStatus, to: DealStatus): boolean {
    const validTransitions: Record<DealStatus, DealStatus[]> = {
      PENDING: ['HOLD', 'REFUND'], // HOLD when paid, REFUND if cancelled before payment
      HOLD: ['SHIPPED', 'DISPUTE', 'REFUND'],
      SHIPPED: ['RELEASED', 'DISPUTE', 'REFUND'],
      RELEASED: [], // Terminal state
      DISPUTE: ['REFUND', 'RELEASED'], // Admin resolves
      REFUND: [], // Terminal state
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Validate and return the new status, or throw if invalid
   */
  static transition(from: DealStatus, to: DealStatus): DealStatus {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid state transition: ${from} → ${to}. Valid transitions from ${from}: ${this.getValidTransitions(from).join(', ')}`
      );
    }
    return to;
  }

  /**
   * Get all valid transitions from a state
   */
  static getValidTransitions(from: DealStatus): DealStatus[] {
    const validTransitions: Record<DealStatus, DealStatus[]> = {
      PENDING: ['HOLD', 'REFUND'],
      HOLD: ['SHIPPED', 'DISPUTE', 'REFUND'],
      SHIPPED: ['RELEASED', 'DISPUTE', 'REFUND'],
      RELEASED: [],
      DISPUTE: ['REFUND', 'RELEASED'],
      REFUND: [],
    };

    return validTransitions[from] ?? [];
  }

  /**
   * Check if a state is terminal (no further transitions)
   */
  static isTerminal(state: DealStatus): boolean {
    return state === 'RELEASED' || state === 'REFUND';
  }

  /**
   * Check if a deal can be cancelled (only PENDING and unpaid)
   */
  static canCancel(status: DealStatus): boolean {
    return status === 'PENDING';
  }

  /**
   * Check if a dispute can be opened (HOLD or SHIPPED)
   */
  static canOpenDispute(status: DealStatus): boolean {
    return status === 'HOLD' || status === 'SHIPPED';
  }

  /**
   * Check if auto-release is allowed (SHIPPED with delivered_at set)
   */
  static canAutoRelease(status: DealStatus, hasTracking: boolean, deliveredAt: Date | null): boolean {
    return status === 'SHIPPED' && hasTracking && deliveredAt !== null;
  }
}
