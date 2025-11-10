import { DealStatus } from '../types';

/**
 * Escrow State Machine
 * 
 * States: PENDING → HOLD → SHIPPED → RELEASED
 * Branches: ... → DISPUTE → (REFUND | RELEASED)
 * 
 * Transitions:
 * - PENDING: Initial state when deal created
 * - HOLD: Buyer paid, money held in escrow
 * - SHIPPED: Seller added tracking info
 * - RELEASED: Money released to seller
 * - DISPUTE: Buyer opened dispute
 * - REFUND: Admin resolved dispute in buyer's favor
 */

export type EscrowEvent =
  | { type: 'PAY' }
  | { type: 'SHIP'; trackingNumber: string; courier: string }
  | { type: 'CONFIRM_RECEIVED' }
  | { type: 'AUTO_RELEASE' }
  | { type: 'OPEN_DISPUTE'; reason: string }
  | { type: 'RESOLVE_RELEASE' }
  | { type: 'RESOLVE_REFUND' }
  | { type: 'FORCE_RELEASE' };

export interface TransitionResult {
  valid: boolean;
  newStatus?: DealStatus;
  error?: string;
}

/**
 * State transition guard
 * Returns the new state if transition is valid, or throws error
 */
export function transition(
  currentStatus: DealStatus,
  event: EscrowEvent
): TransitionResult {
  switch (event.type) {
    case 'PAY':
      if (currentStatus === 'PENDING') {
        return { valid: true, newStatus: 'HOLD' };
      }
      return {
        valid: false,
        error: `Cannot PAY from status ${currentStatus}. Must be PENDING.`,
      };

    case 'SHIP':
      if (currentStatus === 'HOLD') {
        return { valid: true, newStatus: 'SHIPPED' };
      }
      return {
        valid: false,
        error: `Cannot SHIP from status ${currentStatus}. Must be HOLD.`,
      };

    case 'CONFIRM_RECEIVED':
      if (currentStatus === 'SHIPPED') {
        return { valid: true, newStatus: 'RELEASED' };
      }
      return {
        valid: false,
        error: `Cannot CONFIRM_RECEIVED from status ${currentStatus}. Must be SHIPPED.`,
      };

    case 'AUTO_RELEASE':
      if (currentStatus === 'SHIPPED') {
        return { valid: true, newStatus: 'RELEASED' };
      }
      return {
        valid: false,
        error: `Cannot AUTO_RELEASE from status ${currentStatus}. Must be SHIPPED.`,
      };

    case 'OPEN_DISPUTE':
      if (['HOLD', 'SHIPPED'].includes(currentStatus)) {
        return { valid: true, newStatus: 'DISPUTE' };
      }
      return {
        valid: false,
        error: `Cannot OPEN_DISPUTE from status ${currentStatus}. Must be HOLD or SHIPPED.`,
      };

    case 'RESOLVE_RELEASE':
      if (currentStatus === 'DISPUTE') {
        return { valid: true, newStatus: 'RELEASED' };
      }
      return {
        valid: false,
        error: `Cannot RESOLVE_RELEASE from status ${currentStatus}. Must be DISPUTE.`,
      };

    case 'RESOLVE_REFUND':
      if (currentStatus === 'DISPUTE') {
        return { valid: true, newStatus: 'REFUND' };
      }
      return {
        valid: false,
        error: `Cannot RESOLVE_REFUND from status ${currentStatus}. Must be DISPUTE.`,
      };

    case 'FORCE_RELEASE':
      // Admin can force release from most states except already released or refunded
      if (['RELEASED', 'REFUND'].includes(currentStatus)) {
        return {
          valid: false,
          error: `Cannot FORCE_RELEASE from status ${currentStatus}. Already finalized.`,
        };
      }
      return { valid: true, newStatus: 'RELEASED' };

    default:
      return { valid: false, error: 'Unknown event type' };
  }
}

/**
 * Check if a status is terminal (no further transitions)
 */
export function isTerminalStatus(status: DealStatus): boolean {
  return ['RELEASED', 'REFUND'].includes(status);
}

/**
 * Check if a status allows dispute
 */
export function canOpenDispute(status: DealStatus): boolean {
  return ['HOLD', 'SHIPPED'].includes(status);
}

/**
 * Check if a status allows cancellation
 */
export function canCancel(status: DealStatus, isPaid: boolean): boolean {
  return status === 'PENDING' && !isPaid;
}
