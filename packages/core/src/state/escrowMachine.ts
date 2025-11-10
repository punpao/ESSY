import { z } from 'zod';

export type EscrowState = 'PENDING' | 'HOLD' | 'SHIPPED' | 'RELEASED' | 'DISPUTE' | 'REFUND';

export type EscrowEvent =
  | { type: 'PAYMENT_PAID' }
  | { type: 'SELLER_SHIP' }
  | { type: 'MARK_DELIVERED' }
  | { type: 'BUYER_CONFIRM' }
  | { type: 'AUTO_RELEASE' }
  | { type: 'DISPUTE_OPEN' }
  | { type: 'ADMIN_REFUND' }
  | { type: 'ADMIN_RELEASE' }
  | { type: 'CANCEL_UNPAID' };

export interface EscrowContext {
  delivered: boolean;
  hasOpenDispute: boolean;
}

const contextSchema = z.object({
  delivered: z.boolean().default(false),
  hasOpenDispute: z.boolean().default(false)
});

export interface EscrowSnapshot {
  state: EscrowState;
  context?: Partial<EscrowContext>;
}

const ensure = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

export const transitionEscrow = (
  snapshot: EscrowSnapshot,
  event: EscrowEvent
): EscrowSnapshot => {
  const currentState = snapshot.state;
  const context = contextSchema.parse(snapshot.context ?? {});

  switch (currentState) {
    case 'PENDING': {
      if (event.type === 'PAYMENT_PAID') {
        return { state: 'HOLD', context };
      }
      if (event.type === 'CANCEL_UNPAID') {
        return { state: 'REFUND', context };
      }
      break;
    }
    case 'HOLD': {
      if (event.type === 'SELLER_SHIP') {
        return { state: 'SHIPPED', context };
      }
      if (event.type === 'ADMIN_RELEASE') {
        return { state: 'RELEASED', context };
      }
      if (event.type === 'DISPUTE_OPEN') {
        return {
          state: 'DISPUTE',
          context: { ...context, hasOpenDispute: true }
        };
      }
      break;
    }
    case 'SHIPPED': {
      if (event.type === 'MARK_DELIVERED') {
        return {
          state: 'SHIPPED',
          context: { ...context, delivered: true }
        };
      }
      if (event.type === 'BUYER_CONFIRM') {
        return { state: 'RELEASED', context };
      }
      if (event.type === 'AUTO_RELEASE') {
        ensure(context.delivered, 'Auto release requires delivery confirmation');
        ensure(!context.hasOpenDispute, 'Cannot auto release while dispute open');
        return { state: 'RELEASED', context };
      }
      if (event.type === 'DISPUTE_OPEN') {
        return {
          state: 'DISPUTE',
          context: { ...context, hasOpenDispute: true }
        };
      }
      if (event.type === 'ADMIN_RELEASE') {
        return { state: 'RELEASED', context };
      }
      break;
    }
    case 'DISPUTE': {
      if (event.type === 'ADMIN_REFUND') {
        return {
          state: 'REFUND',
          context: { ...context, hasOpenDispute: false }
        };
      }
      if (event.type === 'ADMIN_RELEASE') {
        return {
          state: 'RELEASED',
          context: { ...context, hasOpenDispute: false }
        };
      }
      break;
    }
    case 'REFUND':
    case 'RELEASED': {
      // Terminal states; no further transitions.
      throw new Error(`Cannot transition from ${currentState}`);
    }
    default:
      break;
  }

  throw new Error(`Invalid event ${event.type} for state ${currentState}`);
};
