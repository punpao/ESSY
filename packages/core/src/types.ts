import { z } from 'zod';

// User roles
export const UserRole = z.enum(['buyer', 'seller', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

// KYC levels
export const KycLevel = z.enum(['none', 'basic', 'full']);
export type KycLevel = z.infer<typeof KycLevel>;

export const KycStatus = z.enum(['unverified', 'pending', 'verified']);
export type KycStatus = z.infer<typeof KycStatus>;

// Deal/Escrow states
export const DealStatus = z.enum([
  'PENDING',
  'HOLD',
  'SHIPPED',
  'RELEASED',
  'DISPUTE',
  'REFUND',
]);
export type DealStatus = z.infer<typeof DealStatus>;

// Payment statuses
export const PaymentStatus = z.enum(['INIT', 'PAID', 'REFUNDED', 'FAILED']);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

// Dispute statuses
export const DisputeStatus = z.enum([
  'OPEN',
  'NEED_MORE_INFO',
  'RESOLVED_REFUND',
  'RESOLVED_RELEASE',
]);
export type DisputeStatus = z.infer<typeof DisputeStatus>;

// Evidence types
export const EvidenceKind = z.enum(['image', 'chatlog', 'other']);
export type EvidenceKind = z.infer<typeof EvidenceKind>;

// Reputation event types
export const ReputationEventType = z.enum(['positive', 'neutral', 'negative']);
export type ReputationEventType = z.infer<typeof ReputationEventType>;

// Currency
export const Currency = z.enum(['THB']);
export type Currency = z.infer<typeof Currency>;

// Payment provider
export const PaymentProvider = z.enum(['mock_promptpay']);
export type PaymentProvider = z.infer<typeof PaymentProvider>;

// User entity
export interface User {
  id: string;
  role: UserRole;
  lineSub: string | null;
  email: string;
  phone: string | null;
  kycLevel: KycLevel;
  displayName: string;
  createdAt: Date;
}

// Seller profile
export interface SellerProfile {
  id: string;
  userId: string;
  verified: boolean;
  promptpayId: string | null;
  promptpayName: string | null;
  reputationScore: number;
  kycStatus: KycStatus;
  createdAt: Date;
}

// Deal entity
export interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  currency: Currency;
  sellerId: string;
  buyerId: string | null;
  status: DealStatus;
  paylinkToken: string;
  expiresAt: Date;
  trackingNumber: string | null;
  courier: string | null;
  deliveredAt: Date | null;
  autoReleaseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Payment entity
export interface Payment {
  id: string;
  dealId: string;
  provider: PaymentProvider;
  providerRef: string;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
}

// Dispute entity
export interface Dispute {
  id: string;
  dealId: string;
  openedBy: string;
  reasonText: string;
  status: DisputeStatus;
  resolutionNote: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

// Evidence entity
export interface Evidence {
  id: string;
  disputeId: string;
  uploadedBy: string;
  kind: EvidenceKind;
  url: string;
  note: string | null;
  createdAt: Date;
}

// Reputation event
export interface ReputationEvent {
  id: string;
  sellerId: string;
  type: ReputationEventType;
  weight: number;
  note: string | null;
  createdAt: Date;
}
