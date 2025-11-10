import type { DealStatus } from "../types";

export type EscrowTransition =
  | "PAYMENT_RECEIVED"
  | "TRACKING_ADDED"
  | "BUYER_CONFIRMED"
  | "AUTO_RELEASE_TRIGGERED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED_REFUND"
  | "DISPUTE_RESOLVED_RELEASE"
  | "CANCELLED";

export interface EscrowState {
  status: DealStatus;
  canTransition: (transition: EscrowTransition) => boolean;
  getNextState: (transition: EscrowTransition) => DealStatus | null;
}

const STATE_MACHINE: Record<DealStatus, EscrowState> = {
  PENDING: {
    status: "PENDING",
    canTransition: (transition) => {
      return transition === "PAYMENT_RECEIVED" || transition === "CANCELLED";
    },
    getNextState: (transition) => {
      if (transition === "PAYMENT_RECEIVED") return "HOLD";
      if (transition === "CANCELLED") return "PENDING"; // Stay pending, mark as cancelled
      return null;
    },
  },
  HOLD: {
    status: "HOLD",
    canTransition: (transition) => {
      return (
        transition === "TRACKING_ADDED" ||
        transition === "DISPUTE_OPENED" ||
        transition === "CANCELLED"
      );
    },
    getNextState: (transition) => {
      if (transition === "TRACKING_ADDED") return "SHIPPED";
      if (transition === "DISPUTE_OPENED") return "DISPUTE";
      return null;
    },
  },
  SHIPPED: {
    status: "SHIPPED",
    canTransition: (transition) => {
      return (
        transition === "BUYER_CONFIRMED" ||
        transition === "AUTO_RELEASE_TRIGGERED" ||
        transition === "DISPUTE_OPENED"
      );
    },
    getNextState: (transition) => {
      if (transition === "BUYER_CONFIRMED") return "RELEASED";
      if (transition === "AUTO_RELEASE_TRIGGERED") return "RELEASED";
      if (transition === "DISPUTE_OPENED") return "DISPUTE";
      return null;
    },
  },
  RELEASED: {
    status: "RELEASED",
    canTransition: () => false,
    getNextState: () => null,
  },
  DISPUTE: {
    status: "DISPUTE",
    canTransition: (transition) => {
      return (
        transition === "DISPUTE_RESOLVED_REFUND" ||
        transition === "DISPUTE_RESOLVED_RELEASE"
      );
    },
    getNextState: (transition) => {
      if (transition === "DISPUTE_RESOLVED_REFUND") return "REFUND";
      if (transition === "DISPUTE_RESOLVED_RELEASE") return "RELEASED";
      return null;
    },
  },
  REFUND: {
    status: "REFUND",
    canTransition: () => false,
    getNextState: () => null,
  },
};

export function canTransition(
  currentStatus: DealStatus,
  transition: EscrowTransition
): boolean {
  const state = STATE_MACHINE[currentStatus];
  if (!state) return false;
  return state.canTransition(transition);
}

export function getNextState(
  currentStatus: DealStatus,
  transition: EscrowTransition
): DealStatus | null {
  const state = STATE_MACHINE[currentStatus];
  if (!state) return null;
  return state.getNextState(transition);
}

export function validateTransition(
  currentStatus: DealStatus,
  transition: EscrowTransition
): { valid: boolean; nextStatus: DealStatus | null; error?: string } {
  if (!canTransition(currentStatus, transition)) {
    return {
      valid: false,
      nextStatus: null,
      error: `Cannot transition from ${currentStatus} via ${transition}`,
    };
  }

  const nextStatus = getNextState(currentStatus, transition);
  return {
    valid: true,
    nextStatus: nextStatus || currentStatus,
  };
}

export function getAllowedTransitions(
  currentStatus: DealStatus
): EscrowTransition[] {
  const state = STATE_MACHINE[currentStatus];
  if (!state) return [];

  const allTransitions: EscrowTransition[] = [
    "PAYMENT_RECEIVED",
    "TRACKING_ADDED",
    "BUYER_CONFIRMED",
    "AUTO_RELEASE_TRIGGERED",
    "DISPUTE_OPENED",
    "DISPUTE_RESOLVED_REFUND",
    "DISPUTE_RESOLVED_RELEASE",
    "CANCELLED",
  ];

  return allTransitions.filter((t) => state.canTransition(t));
}
