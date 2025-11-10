import { EscrowContext, EscrowEvent, DealStatus } from "../types";

const terminalStates: DealStatus[] = ["RELEASED", "REFUND"];

export class EscrowStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EscrowStateError";
  }
}

export function computeAutoReleaseAt(
  deliveredAt: Date | null | undefined,
  hours = 48
): Date | null {
  if (!deliveredAt) {
    return null;
  }

  const autoReleaseAt = new Date(deliveredAt);
  autoReleaseAt.setHours(autoReleaseAt.getHours() + hours);
  return autoReleaseAt;
}

function assertGuard(condition: boolean, message: string): void {
  if (!condition) {
    throw new EscrowStateError(message);
  }
}

export function transitionEscrowState(
  current: DealStatus,
  event: EscrowEvent,
  context: EscrowContext
): DealStatus {
  if (terminalStates.includes(current)) {
    throw new EscrowStateError(`State ${current} is terminal; no further transitions allowed.`);
  }

  switch (current) {
    case "PENDING": {
      if (event.type === "PAYMENT_HOLD") {
        assertGuard(context.hasPayment, "Payment must exist before moving to HOLD.");
        return "HOLD";
      }
      if (event.type === "CANCEL") {
        assertGuard(!context.hasPayment, "Cannot cancel after payment is captured.");
        return "REFUND";
      }
      break;
    }
    case "HOLD": {
      if (event.type === "SHIP") {
        assertGuard(context.hasPayment, "Payment must remain captured.");
        return "SHIPPED";
      }
      if (event.type === "CONFIRM_RECEIPT" || event.type === "RESOLVE_RELEASE") {
        return "RELEASED";
      }
      if (event.type === "OPEN_DISPUTE") {
        return "DISPUTE";
      }
      if (event.type === "RESOLVE_REFUND") {
        return "REFUND";
      }
      break;
    }
    case "SHIPPED": {
      if (event.type === "CONFIRM_RECEIPT" || event.type === "RESOLVE_RELEASE") {
        return "RELEASED";
      }
      if (event.type === "OPEN_DISPUTE") {
        return "DISPUTE";
      }
      if (event.type === "AUTO_RELEASE") {
        assertGuard(
          Boolean(context.autoReleaseAt) &&
            Boolean(context.now) &&
            context.now!.getTime() >= context.autoReleaseAt!.getTime(),
          "Auto-release cannot occur before the threshold."
        );
        assertGuard(!context.hasOpenDispute, "Cannot auto-release when a dispute is open.");
        return "RELEASED";
      }
      break;
    }
    case "DISPUTE": {
      if (event.type === "RESOLVE_RELEASE") {
        return "RELEASED";
      }
      if (event.type === "RESOLVE_REFUND") {
        return "REFUND";
      }
      break;
    }
    default:
      break;
  }

  throw new EscrowStateError(
    `Invalid transition from ${current} via ${event.type} with context ${JSON.stringify({
      ...context,
      now: context.now?.toISOString()
    })}`
  );
}

export function canTransition(
  current: DealStatus,
  event: EscrowEvent,
  context: EscrowContext
): boolean {
  try {
    transitionEscrowState(current, event, context);
    return true;
  } catch {
    return false;
  }
}

export function isTerminal(state: DealStatus): boolean {
  return terminalStates.includes(state);
}
