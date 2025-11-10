import { DealStatus } from "../types/deal";

export type EscrowEvent =
  | { type: "PAYMENT_HOLD" }
  | { type: "SELLER_SHIP" }
  | { type: "MARK_DELIVERED" }
  | { type: "BUYER_CONFIRM" }
  | { type: "AUTO_RELEASE" }
  | { type: "BUYER_DISPUTE" }
  | { type: "ADMIN_REFUND" }
  | { type: "ADMIN_RELEASE" }
  | { type: "DISPUTE_REQUEST_INFO" }
  | { type: "DISPUTE_RESOLVE_REFUND" }
  | { type: "DISPUTE_RESOLVE_RELEASE" }
  | { type: "CANCEL" };

export class EscrowTransitionError extends Error {
  constructor(readonly from: DealStatus, readonly event: EscrowEvent) {
    super(`Invalid escrow transition from ${from} via ${event.type}`);
  }
}

export type EscrowTransition = {
  from: DealStatus;
  event: EscrowEvent["type"];
  to: DealStatus;
};

export const terminalStates: DealStatus[] = ["RELEASED", "REFUND"];

const transitionTable: Record<DealStatus, Partial<Record<EscrowEvent["type"], DealStatus>>> = {
  PENDING: {
    PAYMENT_HOLD: "HOLD",
    CANCEL: "REFUND"
  },
  HOLD: {
    SELLER_SHIP: "SHIPPED",
    BUYER_DISPUTE: "DISPUTE",
    ADMIN_REFUND: "REFUND",
    ADMIN_RELEASE: "RELEASED"
  },
  SHIPPED: {
    MARK_DELIVERED: "SHIPPED",
    BUYER_CONFIRM: "RELEASED",
    AUTO_RELEASE: "RELEASED",
    BUYER_DISPUTE: "DISPUTE",
    ADMIN_REFUND: "REFUND",
    ADMIN_RELEASE: "RELEASED"
  },
  DISPUTE: {
    DISPUTE_REQUEST_INFO: "DISPUTE",
    DISPUTE_RESOLVE_REFUND: "REFUND",
    DISPUTE_RESOLVE_RELEASE: "RELEASED"
  },
  RELEASED: {},
  REFUND: {}
};

const validEventsByState: Record<DealStatus, Set<EscrowEvent["type"]>> = Object.entries(
  transitionTable
).reduce((acc, [state, map]) => {
  acc[state as DealStatus] = new Set(Object.keys(map) as EscrowEvent["type"][]);
  return acc;
}, {} as Record<DealStatus, Set<EscrowEvent["type"]>>);

export const isTerminalState = (status: DealStatus): boolean =>
  terminalStates.includes(status);

export function canTransition(status: DealStatus, event: EscrowEvent["type"]): boolean {
  return validEventsByState[status]?.has(event) ?? false;
}

export function transition(current: DealStatus, event: EscrowEvent): DealStatus {
  const next = transitionTable[current]?.[event.type];
  if (!next) {
    throw new EscrowTransitionError(current, event);
  }
  return next;
}

export type AutoReleaseContext = {
  deliveredAt: Date | null;
  autoReleaseAt: Date | null;
  now: Date;
  disputeOpen: boolean;
};

export function shouldAutoRelease(context: AutoReleaseContext): boolean {
  if (!context.autoReleaseAt || context.disputeOpen) {
    return false;
  }

  if (context.autoReleaseAt.getTime() <= context.now.getTime()) {
    return true;
  }

  return false;
}

export type EscrowStateSummary = {
  status: DealStatus;
  isTerminal: boolean;
  availableEvents: EscrowEvent["type"][];
};

export function summarize(status: DealStatus): EscrowStateSummary {
  return {
    status,
    isTerminal: isTerminalState(status),
    availableEvents: Array.from(validEventsByState[status] ?? [])
  };
}
