import type { DealStatus, DealTransition } from '../types';

/**
 * Escrow State Machine
 * Valid transitions:
 * - PENDING -> HOLD (payment received)
 * - HOLD -> SHIPPED (seller adds tracking)
 * - SHIPPED -> RELEASED (buyer confirms OR auto-release after delivery)
 * - HOLD -> DISPUTE (buyer opens dispute before shipping)
 * - SHIPPED -> DISPUTE (buyer opens dispute after shipping)
 * - DISPUTE -> REFUND (admin resolves)
 * - DISPUTE -> RELEASED (admin resolves)
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
    const validTransitions: Record<DealStatus, DealStatus[]> = {
      PENDING: ['HOLD', 'REFUND'], // Can only go to HOLD (paid) or REFUND (cancelled)
      HOLD: ['SHIPPED', 'DISPUTE', 'REFUND'], // Can ship, dispute, or refund
      SHIPPED: ['RELEASED', 'DISPUTE', 'REFUND'], // Can release, dispute, or refund
      RELEASED: [], // Terminal state
      DISPUTE: ['REFUND', 'RELEASED'], // Admin can resolve
      REFUND: [], // Terminal state
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Validate and execute a transition
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
        `Invalid transition from ${from} to ${to}. Context: ${JSON.stringify(context)}`
      );
    }

    // Additional context-based validation
    if (to === 'HOLD' && !context?.hasPayment) {
      throw new Error('Cannot transition to HOLD without payment');
    }

    if (to === 'SHIPPED' && !context?.hasTracking) {
      throw new Error('Cannot transition to SHIPPED without tracking');
    }

    return { from, to };
  }

  /**
   * Get all possible next states from current state
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
      PENDING: ['HOLD', 'REFUND'],
      HOLD: ['SHIPPED', 'DISPUTE', 'REFUND'],
      SHIPPED: ['RELEASED', 'DISPUTE', 'REFUND'],
      RELEASED: [],
      DISPUTE: ['REFUND', 'RELEASED'],
      REFUND: [],
    };

    return transitions[current] ?? [];
  }

  /**
   * Check if state is terminal (no more transitions possible)
   */
  static isTerminal(state: DealStatus): boolean {
    return state === 'RELEASED' || state === 'REFUND';
  }

  /**
   * Check if auto-release is allowed
   * Auto-release: SHIPPED -> RELEASED if delivered_at exists and 48h passed
   */
  static canAutoRelease(
    status: DealStatus,
    deliveredAt: Date | null,
    autoReleaseAt: Date | null,
    hasOpenDispute: boolean
  ): boolean {
    if (status !== 'SHIPPED') return false;
    if (hasOpenDispute) return false;
    if (!deliveredAt || !autoReleaseAt) return false;
    return new Date() >= autoReleaseAt;
  }
}
