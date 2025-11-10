import type { DealStatus } from '../types';

export type EscrowEvent =
  | { type: 'PAYMENT_RECEIVED' }
  | { type: 'SHIPPED'; trackingNumber: string; courier: string }
  | { type: 'DELIVERED' }
  | { type: 'BUYER_CONFIRMED' }
  | { type: 'DISPUTE_OPENED' }
  | { type: 'DISPUTE_RESOLVED_REFUND' }
  | { type: 'DISPUTE_RESOLVED_RELEASE' }
  | { type: 'AUTO_RELEASE' }
  | { type: 'CANCEL' };

export interface EscrowContext {
  status: DealStatus;
  hasPayment: boolean;
  hasTracking: boolean;
  isDelivered: boolean;
  hasOpenDispute: boolean;
}

/**
 * Pure state machine for escrow transitions
 * Implements: PENDING → HOLD → SHIPPED → RELEASED
 * With branch: ... → DISPUTE → (REFUND | RELEASED)
 */
export function escrowTransition(
  currentStatus: DealStatus,
  event: EscrowEvent,
  context: EscrowContext
): DealStatus {
  switch (currentStatus) {
    case 'PENDING':
      if (event.type === 'PAYMENT_RECEIVED') {
        return 'HOLD';
      }
      if (event.type === 'CANCEL') {
        return 'PENDING'; // Can cancel, but status stays PENDING (deal deleted)
      }
      break;

    case 'HOLD':
      if (event.type === 'SHIPPED') {
        return 'SHIPPED';
      }
      if (event.type === 'DISPUTE_OPENED') {
        return 'DISPUTE';
      }
      break;

    case 'SHIPPED':
      if (event.type === 'BUYER_CONFIRMED') {
        return 'RELEASED';
      }
      if (event.type === 'DELIVERED') {
        // Auto-release check happens externally, but we allow transition
        return 'RELEASED';
      }
      if (event.type === 'AUTO_RELEASE') {
        return 'RELEASED';
      }
      if (event.type === 'DISPUTE_OPENED') {
        return 'DISPUTE';
      }
      break;

    case 'DISPUTE':
      if (event.type === 'DISPUTE_RESOLVED_REFUND') {
        return 'REFUND';
      }
      if (event.type === 'DISPUTE_RESOLVED_RELEASE') {
        return 'RELEASED';
      }
      break;

    case 'RELEASED':
    case 'REFUND':
      // Terminal states - no transitions allowed
      break;
  }

  // Invalid transition - return current status
  return currentStatus;
}

/**
 * Check if a transition is valid
 */
export function canTransition(
  currentStatus: DealStatus,
  event: EscrowEvent,
  context: EscrowContext
): boolean {
  const newStatus = escrowTransition(currentStatus, event, context);
  return newStatus !== currentStatus;
}

/**
 * Get all valid events for current state
 */
export function getValidEvents(
  status: DealStatus,
  context: EscrowContext
): EscrowEvent['type'][] {
  const valid: EscrowEvent['type'][] = [];

  switch (status) {
    case 'PENDING':
      if (!context.hasPayment) {
        valid.push('PAYMENT_RECEIVED');
      }
      valid.push('CANCEL');
      break;

    case 'HOLD':
      valid.push('SHIPPED');
      valid.push('DISPUTE_OPENED');
      break;

    case 'SHIPPED':
      valid.push('BUYER_CONFIRMED');
      if (context.isDelivered) {
        valid.push('DELIVERED', 'AUTO_RELEASE');
      }
      valid.push('DISPUTE_OPENED');
      break;

    case 'DISPUTE':
      valid.push('DISPUTE_RESOLVED_REFUND', 'DISPUTE_RESOLVED_RELEASE');
      break;

    case 'RELEASED':
    case 'REFUND':
      // Terminal states
      break;
  }

  return valid;
}
