import { AutoReleaseRuleInput, DealStatus } from '../types';

export type EscrowEvent =
  | { type: 'PAYMENT_HOLD' }
  | { type: 'SHIP' }
  | { type: 'CANCEL' }
  | { type: 'DELIVERED' }
  | { type: 'BUYER_CONFIRM' }
  | { type: 'OPEN_DISPUTE' }
  | { type: 'ADMIN_RESOLVE_RELEASE' }
  | { type: 'ADMIN_RESOLVE_REFUND' }
  | { type: 'ADMIN_FORCE_RELEASE' }
  | { type: 'AUTO_RELEASE' };

const transitionTable: Record<DealStatus, Record<EscrowEvent['type'], DealStatus>> = {
  PENDING: {
    PAYMENT_HOLD: 'HOLD',
    CANCEL: 'REFUND'
  },
  HOLD: {
    SHIP: 'SHIPPED',
    OPEN_DISPUTE: 'DISPUTE',
    ADMIN_FORCE_RELEASE: 'RELEASED',
    ADMIN_RESOLVE_REFUND: 'REFUND',
    AUTO_RELEASE: 'RELEASED'
  },
  SHIPPED: {
    BUYER_CONFIRM: 'RELEASED',
    OPEN_DISPUTE: 'DISPUTE',
    DELIVERED: 'SHIPPED',
    AUTO_RELEASE: 'RELEASED',
    ADMIN_FORCE_RELEASE: 'RELEASED',
    ADMIN_RESOLVE_REFUND: 'REFUND'
  },
  RELEASED: {},
  DISPUTE: {
    ADMIN_RESOLVE_REFUND: 'REFUND',
    ADMIN_RESOLVE_RELEASE: 'RELEASED'
  },
  REFUND: {}
};

export function transitionStatus(current: DealStatus, event: EscrowEvent): DealStatus {
  const allowedTransitions = transitionTable[current];
  if (!allowedTransitions) {
    throw new Error(`Unknown current status: ${current}`);
  }

  const next = allowedTransitions[event.type];
  if (!next) {
    throw new Error(`Invalid transition from ${current} via ${event.type}`);
  }
  return next;
}

export function shouldAutoRelease(input: AutoReleaseRuleInput): boolean {
  const { deliveredAt, buyerConfirmedAt, now, silentForHours } = input;
  if (!deliveredAt) {
    return false;
  }
  if (buyerConfirmedAt) {
    return false;
  }
  const msSinceDelivery = now.getTime() - deliveredAt.getTime();
  const requiredMs = silentForHours * 60 * 60 * 1000;
  return msSinceDelivery >= requiredMs;
}

export function computeAutoReleaseAt(deliveredAt: Date, silentForHours: number): Date {
  return new Date(deliveredAt.getTime() + silentForHours * 60 * 60 * 1000);
}
