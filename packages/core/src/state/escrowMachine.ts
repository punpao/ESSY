import { addHours } from '../utils/time';

type BaseEvent<T extends string, P = undefined> = P extends undefined
  ? { type: T }
  : { type: T; payload: P };

export type DealStatus =
  | 'PENDING'
  | 'HOLD'
  | 'SHIPPED'
  | 'RELEASED'
  | 'DISPUTE'
  | 'REFUND';

export interface EscrowContext {
  hasPayment: boolean;
  hasTracking: boolean;
  deliveredAt?: Date | null;
  buyerConfirmed?: boolean;
  disputeOpen?: boolean;
  autoReleaseHours: number;
  now?: Date;
}

export type EscrowEvent =
  | BaseEvent<'PAYMENT_PAID'>
  | BaseEvent<'SELLER_SET_TRACKING'>
  | BaseEvent<'MARK_DELIVERED', { deliveredAt: Date }>
  | BaseEvent<'BUYER_CONFIRM_RECEIPT'>
  | BaseEvent<'AUTO_RELEASE_CHECK'>
  | BaseEvent<'BUYER_OPEN_DISPUTE'>
  | BaseEvent<'ADMIN_RESOLVE_REFUND'>
  | BaseEvent<'ADMIN_RESOLVE_RELEASE'>
  | BaseEvent<'ADMIN_FORCE_RELEASE'>
  | BaseEvent<'ADMIN_FORCE_REFUND'>
  | BaseEvent<'CANCEL_PENDING'>;

export interface TransitionResult {
  from: DealStatus;
  to: DealStatus;
  changed: boolean;
  reason: string;
  autoReleaseAt?: Date | null;
}

type Guard = (context: EscrowContext) => boolean;

type TransitionHandler = (context: EscrowContext) => TransitionResult;

type StateTransitions = {
  [K in EscrowEvent['type']]?: TransitionHandler;
};

type MachineConfig = Record<DealStatus, StateTransitions>;

const requirePayment: Guard = (ctx) => ctx.hasPayment;
const requireTracking: Guard = (ctx) => ctx.hasTracking;
const requireDisputeOpen: Guard = (ctx) => Boolean(ctx.disputeOpen);

const computeAutoRelease = (ctx: EscrowContext, deliveredAt: Date) =>
  addHours(deliveredAt, ctx.autoReleaseHours ?? 48);

const ensure = (condition: boolean, failureReason: string) => {
  if (!condition) {
    throw new Error(failureReason);
  }
};

const machine: MachineConfig = {
  PENDING: {
    PAYMENT_PAID: (ctx) => {
      ensure(requirePayment(ctx), 'Payment must be recorded before HOLD');
      return {
        from: 'PENDING',
        to: 'HOLD',
        changed: true,
        reason: 'Payment received via PromptPay',
      };
    },
    CANCEL_PENDING: (ctx) => {
      ensure(!ctx.hasPayment, 'Cannot cancel after payment is made');
      return {
        from: 'PENDING',
        to: 'REFUND',
        changed: true,
        reason: 'Deal cancelled before payment',
      };
    },
  },
  HOLD: {
    SELLER_SET_TRACKING: (ctx) => {
      ensure(requireTracking(ctx), 'Tracking must be set');
      return {
        from: 'HOLD',
        to: 'SHIPPED',
        changed: true,
        reason: 'Seller provided tracking info',
      };
    },
    BUYER_CONFIRM_RECEIPT: () => ({
      from: 'HOLD',
      to: 'RELEASED',
      changed: true,
      reason: 'Buyer confirmed receipt',
    }),
    BUYER_OPEN_DISPUTE: () => ({
      from: 'HOLD',
      to: 'DISPUTE',
      changed: true,
      reason: 'Buyer opened a dispute',
    }),
    ADMIN_FORCE_RELEASE: () => ({
      from: 'HOLD',
      to: 'RELEASED',
      changed: true,
      reason: 'Admin forced release',
    }),
    ADMIN_FORCE_REFUND: () => ({
      from: 'HOLD',
      to: 'REFUND',
      changed: true,
      reason: 'Admin forced refund',
    }),
  },
  SHIPPED: {
    MARK_DELIVERED: (ctx) => {
      ensure(requireTracking(ctx), 'Tracking must exist to mark delivered');
      ensure(Boolean(ctx.deliveredAt), 'Delivered timestamp missing');
      const autoReleaseAt = computeAutoRelease(
        ctx,
        ctx.deliveredAt as Date
      );
      return {
        from: 'SHIPPED',
        to: 'SHIPPED',
        changed: false,
        reason: 'Delivery timestamp recorded',
        autoReleaseAt,
      };
    },
    BUYER_CONFIRM_RECEIPT: () => ({
      from: 'SHIPPED',
      to: 'RELEASED',
      changed: true,
      reason: 'Buyer confirmed after shipment',
    }),
    AUTO_RELEASE_CHECK: (ctx) => {
      ensure(requireTracking(ctx), 'Cannot auto-release without tracking');
      ensure(Boolean(ctx.deliveredAt), 'Cannot auto-release before delivery');
      const now = ctx.now ?? new Date();
      const autoReleaseAt = computeAutoRelease(
        ctx,
        ctx.deliveredAt as Date
      );
      ensure(
        now >= autoReleaseAt,
        'Auto release not yet eligible based on timestamp'
      );
      return {
        from: 'SHIPPED',
        to: 'RELEASED',
        changed: true,
        reason: 'Auto release after delivery window elapsed',
        autoReleaseAt,
      };
    },
    BUYER_OPEN_DISPUTE: () => ({
      from: 'SHIPPED',
      to: 'DISPUTE',
      changed: true,
      reason: 'Buyer disputed after shipment',
    }),
    ADMIN_FORCE_RELEASE: () => ({
      from: 'SHIPPED',
      to: 'RELEASED',
      changed: true,
      reason: 'Admin forced release while shipped',
    }),
    ADMIN_FORCE_REFUND: () => ({
      from: 'SHIPPED',
      to: 'REFUND',
      changed: true,
      reason: 'Admin forced refund while shipped',
    }),
  },
  RELEASED: {
    ADMIN_FORCE_REFUND: () => ({
      from: 'RELEASED',
      to: 'REFUND',
      changed: true,
      reason: 'Admin reversed after release',
    }),
  },
  DISPUTE: {
    ADMIN_RESOLVE_REFUND: () => ({
      from: 'DISPUTE',
      to: 'REFUND',
      changed: true,
      reason: 'Dispute resolved in favor of buyer',
    }),
    ADMIN_RESOLVE_RELEASE: () => ({
      from: 'DISPUTE',
      to: 'RELEASED',
      changed: true,
      reason: 'Dispute resolved in favor of seller',
    }),
    ADMIN_FORCE_RELEASE: () => ({
      from: 'DISPUTE',
      to: 'RELEASED',
      changed: true,
      reason: 'Admin forced release during dispute',
    }),
    ADMIN_FORCE_REFUND: () => ({
      from: 'DISPUTE',
      to: 'REFUND',
      changed: true,
      reason: 'Admin forced refund during dispute',
    }),
  },
  REFUND: {},
};

const exhaustiveCheck = (_value: never): never => {
  throw new Error('Unhandled transition configuration');
};

export const transitionEscrowState = (
  current: DealStatus,
  event: EscrowEvent,
  context: EscrowContext
): TransitionResult => {
  const transitions = machine[current];
  if (!transitions) {
    return exhaustiveCheck(current as never);
  }
  const handler = transitions[event.type];
  if (!handler) {
    throw new Error(
      `Invalid transition from ${current} using event ${event.type}`
    );
  }
  try {
    return handler(context);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed transition from ${current} via ${event.type}: ${error.message}`
      );
    }
    throw error;
  }
};

export const canTransition = (
  current: DealStatus,
  eventType: EscrowEvent['type']
): boolean => {
  const transitions = machine[current];
  return Boolean(transitions && transitions[eventType]);
};

export const getAutoReleaseAt = (
  deliveredAt: Date | null | undefined,
  autoReleaseHours: number
) => {
  if (!deliveredAt) {
    return null;
  }
  return addHours(deliveredAt, autoReleaseHours);
};
