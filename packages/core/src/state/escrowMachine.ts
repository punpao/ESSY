import { z } from "zod";

export const DealStatusSchema = z.enum([
  "PENDING",
  "HOLD",
  "SHIPPED",
  "RELEASED",
  "DISPUTE",
  "REFUND",
]);

export type DealStatus = z.infer<typeof DealStatusSchema>;

export interface EscrowTransition {
  from: DealStatus;
  to: DealStatus;
  guard?: (context: EscrowContext) => boolean;
}

export interface EscrowContext {
  status: DealStatus;
  paymentStatus?: "INIT" | "PAID" | "REFUNDED" | "FAILED";
  trackingNumber?: string | null;
  deliveredAt?: Date | null;
  autoReleaseAt?: Date | null;
  hasOpenDispute?: boolean;
  buyerId?: string | null;
}

const VALID_TRANSITIONS: EscrowTransition[] = [
  // PENDING → HOLD (when payment is received)
  {
    from: "PENDING",
    to: "HOLD",
    guard: (ctx) => ctx.paymentStatus === "PAID" && !!ctx.buyerId,
  },
  // HOLD → SHIPPED (seller adds tracking)
  {
    from: "HOLD",
    to: "SHIPPED",
    guard: (ctx) => !!ctx.trackingNumber,
  },
  // SHIPPED → RELEASED (buyer confirms or auto-release)
  {
    from: "SHIPPED",
    to: "RELEASED",
    guard: (ctx) =>
      !!ctx.deliveredAt &&
      (ctx.autoReleaseAt ? new Date() >= ctx.autoReleaseAt : false),
  },
  // Any state → DISPUTE (buyer opens dispute)
  {
    from: "HOLD",
    to: "DISPUTE",
    guard: (ctx) => !ctx.hasOpenDispute,
  },
  {
    from: "SHIPPED",
    to: "DISPUTE",
    guard: (ctx) => !ctx.hasOpenDispute,
  },
  // DISPUTE → REFUND (admin resolves)
  {
    from: "DISPUTE",
    to: "REFUND",
  },
  // DISPUTE → RELEASED (admin resolves)
  {
    from: "DISPUTE",
    to: "RELEASED",
  },
];

export function canTransition(
  from: DealStatus,
  to: DealStatus,
  context: EscrowContext
): boolean {
  // Same state is always valid (no-op)
  if (from === to) return true;

  const transition = VALID_TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!transition) return false;

  // Check guard if present
  if (transition.guard) {
    return transition.guard(context);
  }

  return true;
}

export function getValidNextStates(
  currentStatus: DealStatus,
  context: EscrowContext
): DealStatus[] {
  const validStates: DealStatus[] = [];

  for (const transition of VALID_TRANSITIONS) {
    if (transition.from === currentStatus) {
      if (!transition.guard || transition.guard(context)) {
        validStates.push(transition.to);
      }
    }
  }

  return validStates;
}

export function validateTransition(
  from: DealStatus,
  to: DealStatus,
  context: EscrowContext
): { valid: boolean; reason?: string } {
  if (from === to) {
    return { valid: true };
  }

  if (!canTransition(from, to, context)) {
    return {
      valid: false,
      reason: `Cannot transition from ${from} to ${to} with current context`,
    };
  }

  return { valid: true };
}

// Auto-release calculation: 48 hours after delivery
export function calculateAutoReleaseAt(deliveredAt: Date | null): Date | null {
  if (!deliveredAt) return null;
  const hours = parseInt(process.env.AUTO_RELEASE_HOURS || "48", 10);
  return new Date(deliveredAt.getTime() + hours * 60 * 60 * 1000);
}
