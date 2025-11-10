import { z } from "zod";

// ============================
// ENUMS & CONSTANTS
// ============================

export const DealStatus = {
  PENDING: "PENDING",
  HOLD: "HOLD",
  SHIPPED: "SHIPPED",
  RELEASED: "RELEASED",
  DISPUTE: "DISPUTE",
  REFUND: "REFUND",
} as const;

export type DealStatusType = (typeof DealStatus)[keyof typeof DealStatus];

export const PaymentStatus = {
  INIT: "INIT",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const DisputeStatus = {
  OPEN: "OPEN",
  NEED_MORE_INFO: "NEED_MORE_INFO",
  RESOLVED_REFUND: "RESOLVED_REFUND",
  RESOLVED_RELEASE: "RESOLVED_RELEASE",
} as const;

export type DisputeStatusType = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const UserRole = {
  BUYER: "buyer",
  SELLER: "seller",
  ADMIN: "admin",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const KycLevel = {
  NONE: "none",
  BASIC: "basic",
  FULL: "full",
} as const;

export type KycLevelType = (typeof KycLevel)[keyof typeof KycLevel];

export const KycStatus = {
  UNVERIFIED: "unverified",
  PENDING: "pending",
  VERIFIED: "verified",
} as const;

export type KycStatusType = (typeof KycStatus)[keyof typeof KycStatus];

export const ReputationEventType = {
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  NEGATIVE: "negative",
} as const;

export type ReputationEventTypeEnum =
  (typeof ReputationEventType)[keyof typeof ReputationEventType];

export const EvidenceKind = {
  IMAGE: "image",
  CHATLOG: "chatlog",
  OTHER: "other",
} as const;

export type EvidenceKindType = (typeof EvidenceKind)[keyof typeof EvidenceKind];

// ============================
// ZOD SCHEMAS
// ============================

export const CreateDealSchema = z.object({
  title: z.string().min(3).max(200),
  amount_satang: z.number().int().positive().max(100_000_000), // Max 1M THB
  currency: z.literal("THB"),
  buyer_note: z.string().max(500).optional(),
});

export const AddTrackingSchema = z.object({
  tracking_number: z.string().min(5).max(100),
  courier: z.string().min(2).max(50),
});

export const OpenDisputeSchema = z.object({
  reason: z.enum(["not_delivered", "item_mismatch", "other"]),
  reason_text: z.string().min(10).max(2000),
});

export const ResolveDisputeSchema = z.object({
  resolution: z.enum(["refund", "release"]),
  resolution_note: z.string().min(5).max(1000),
});

export const UploadEvidenceSchema = z.object({
  kind: z.enum(["image", "chatlog", "other"]),
  url: z.string().url(),
  note: z.string().max(500).optional(),
});

export const VerifyBasicKycSchema = z.object({
  promptpay_id: z.string().min(10).max(20),
  promptpay_name: z.string().min(2).max(100),
  selfie_url: z.string().url(),
});

// ============================
// TYPE EXPORTS
// ============================

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type AddTrackingInput = z.infer<typeof AddTrackingSchema>;
export type OpenDisputeInput = z.infer<typeof OpenDisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;
export type UploadEvidenceInput = z.infer<typeof UploadEvidenceSchema>;
export type VerifyBasicKycInput = z.infer<typeof VerifyBasicKycSchema>;
