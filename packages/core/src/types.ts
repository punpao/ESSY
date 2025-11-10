export type UserRole = "buyer" | "seller" | "admin";

export type DealStatus = "PENDING" | "HOLD" | "SHIPPED" | "RELEASED" | "DISPUTE" | "REFUND";

export type PaymentStatus = "INIT" | "PAID" | "REFUNDED" | "FAILED";

export type PaymentProviderType = "mock_promptpay";

export type DisputeStatus =
  | "OPEN"
  | "NEED_MORE_INFO"
  | "RESOLVED_REFUND"
  | "RESOLVED_RELEASE";

export type EvidenceKind = "image" | "chatlog" | "other";

export interface EscrowContext {
  hasPayment: boolean;
  deliveredAt?: Date | null;
  autoReleaseAt?: Date | null;
  now?: Date;
  hasOpenDispute?: boolean;
  adminOverride?: boolean;
  buyerConfirmed?: boolean;
}

export type EscrowEvent =
  | { type: "PAYMENT_HOLD" }
  | { type: "SHIP"; deliveredAt?: Date | null }
  | { type: "CONFIRM_RECEIPT" }
  | { type: "AUTO_RELEASE" }
  | { type: "OPEN_DISPUTE" }
  | { type: "RESOLVE_RELEASE" }
  | { type: "RESOLVE_REFUND" }
  | { type: "CANCEL" };
