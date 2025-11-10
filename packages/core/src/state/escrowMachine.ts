import { DealStatus } from '../types';

export interface StateTransition {
  from: DealStatus;
  to: DealStatus;
  event: string;
  guard?: (context: TransitionContext) => boolean;
}

export interface TransitionContext {
  currentStatus: DealStatus;
  hasPayment?: boolean;
  hasTracking?: boolean;
  hasBuyer?: boolean;
  hasOpenDispute?: boolean;
  autoReleaseReady?: boolean;
  isAdmin?: boolean;
}

export class EscrowStateMachine {
  private static transitions: StateTransition[] = [
    // PENDING → HOLD (when payment received)
    {
      from: 'PENDING',
      to: 'HOLD',
      event: 'PAYMENT_RECEIVED',
      guard: (ctx) => ctx.hasPayment === true && ctx.hasBuyer === true,
    },
    // PENDING → CANCELLED (seller cancels before payment)
    {
      from: 'PENDING',
      to: 'CANCELLED',
      event: 'CANCEL',
      guard: (ctx) => ctx.hasPayment !== true,
    },
    // HOLD → SHIPPED (seller adds tracking)
    {
      from: 'HOLD',
      to: 'SHIPPED',
      event: 'ADD_TRACKING',
      guard: (ctx) => ctx.hasTracking === true,
    },
    // HOLD → DISPUTE (buyer opens dispute)
    {
      from: 'HOLD',
      to: 'DISPUTE',
      event: 'OPEN_DISPUTE',
      guard: () => true,
    },
    // SHIPPED → RELEASED (buyer confirms OR auto-release)
    {
      from: 'SHIPPED',
      to: 'RELEASED',
      event: 'CONFIRM_RECEIVED',
      guard: () => true,
    },
    {
      from: 'SHIPPED',
      to: 'RELEASED',
      event: 'AUTO_RELEASE',
      guard: (ctx) => ctx.autoReleaseReady === true && ctx.hasOpenDispute !== true,
    },
    // SHIPPED → DISPUTE (buyer opens dispute)
    {
      from: 'SHIPPED',
      to: 'DISPUTE',
      event: 'OPEN_DISPUTE',
      guard: () => true,
    },
    // DISPUTE → REFUND (admin resolves as refund)
    {
      from: 'DISPUTE',
      to: 'REFUND',
      event: 'RESOLVE_REFUND',
      guard: (ctx) => ctx.isAdmin === true,
    },
    // DISPUTE → RELEASED (admin resolves as release)
    {
      from: 'DISPUTE',
      to: 'RELEASED',
      event: 'RESOLVE_RELEASE',
      guard: (ctx) => ctx.isAdmin === true,
    },
    // Admin force actions
    {
      from: 'HOLD',
      to: 'RELEASED',
      event: 'ADMIN_FORCE_RELEASE',
      guard: (ctx) => ctx.isAdmin === true,
    },
    {
      from: 'HOLD',
      to: 'REFUND',
      event: 'ADMIN_FORCE_REFUND',
      guard: (ctx) => ctx.isAdmin === true,
    },
  ];

  static canTransition(from: DealStatus, to: DealStatus, context: TransitionContext): boolean {
    const transition = this.transitions.find((t) => t.from === from && t.to === to);
    if (!transition) {
      return false;
    }
    if (transition.guard) {
      return transition.guard(context);
    }
    return true;
  }

  static getAvailableTransitions(
    currentStatus: DealStatus,
    context: TransitionContext
  ): DealStatus[] {
    return this.transitions
      .filter((t) => t.from === currentStatus)
      .filter((t) => !t.guard || t.guard(context))
      .map((t) => t.to);
  }

  static transition(from: DealStatus, event: string, context: TransitionContext): DealStatus {
    const transition = this.transitions.find(
      (t) => t.from === from && t.event === event && (!t.guard || t.guard(context))
    );

    if (!transition) {
      throw new Error(`Invalid transition: ${from} -> ${event}`);
    }

    return transition.to;
  }

  static isTerminalState(status: DealStatus): boolean {
    return ['RELEASED', 'REFUND', 'CANCELLED'].includes(status);
  }
}
