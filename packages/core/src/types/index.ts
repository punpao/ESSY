import { z } from 'zod';

// User types
export const UserRoleSchema = z.enum(['buyer', 'seller', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const KYCLevelSchema = z.enum(['none', 'basic', 'full']);
export type KYCLevel = z.infer<typeof KYCLevelSchema>;

export const KYCStatusSchema = z.enum(['unverified', 'pending', 'verified']);
export type KYCStatus = z.infer<typeof KYCStatusSchema>;

// Deal/Escrow types
export const DealStatusSchema = z.enum([
  'PENDING',
  'HOLD',
  'SHIPPED',
  'RELEASED',
  'DISPUTE',
  'REFUND',
]);
export type DealStatus = z.infer<typeof DealStatusSchema>;

export const CurrencySchema = z.enum(['THB']);
export type Currency = z.infer<typeof CurrencySchema>;

// Payment types
export const PaymentProviderSchema = z.enum(['mock_promptpay']);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

export const PaymentStatusSchema = z.enum(['INIT', 'PAID', 'REFUNDED', 'FAILED']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// Dispute types
export const DisputeStatusSchema = z.enum([
  'OPEN',
  'NEED_MORE_INFO',
  'RESOLVED_REFUND',
  'RESOLVED_RELEASE',
]);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

export const DisputeReasonSchema = z.enum(['not_received', 'not_as_described', 'other']);
export type DisputeReason = z.infer<typeof DisputeReasonSchema>;

export const EvidenceKindSchema = z.enum(['image', 'chatlog', 'other']);
export type EvidenceKind = z.infer<typeof EvidenceKindSchema>;

// Reputation types
export const ReputationEventTypeSchema = z.enum(['positive', 'neutral', 'negative']);
export type ReputationEventType = z.infer<typeof ReputationEventTypeSchema>;

// DTOs
export interface CreateDealDto {
  title: string;
  amount_satang: number;
  currency: Currency;
  buyer_note?: string;
}

export interface CreatePaymentDto {
  deal_id: string;
  provider: PaymentProvider;
}

export interface PaymentWebhookDto {
  provider_ref: string;
  status: PaymentStatus;
  paid_at?: Date;
}

export interface CreateDisputeDto {
  deal_id: string;
  reason: DisputeReason;
  reason_text: string;
}

export interface ResolveDisputeDto {
  dispute_id: string;
  resolution: 'RESOLVED_REFUND' | 'RESOLVED_RELEASE';
  resolution_note: string;
}

export interface AddTrackingDto {
  deal_id: string;
  tracking_number: string;
  courier: string;
}
