export type UserRole = "buyer" | "seller" | "admin";
export type KYCLevel = "none" | "basic" | "full";
export type DealStatus = "PENDING" | "HOLD" | "SHIPPED" | "RELEASED" | "DISPUTE" | "REFUND";
export type PaymentStatus = "INIT" | "PAID" | "REFUNDED" | "FAILED";
export type DisputeStatus = "OPEN" | "NEED_MORE_INFO" | "RESOLVED_REFUND" | "RESOLVED_RELEASE";
