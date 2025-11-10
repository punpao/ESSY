export type DealStatus =
  | 'PENDING'
  | 'HOLD'
  | 'SHIPPED'
  | 'RELEASED'
  | 'DISPUTE'
  | 'REFUND';

export type PaymentStatus = 'INIT' | 'PAID' | 'REFUNDED' | 'FAILED';

export type DisputeStatus =
  | 'OPEN'
  | 'NEED_MORE_INFO'
  | 'RESOLVED_REFUND'
  | 'RESOLVED_RELEASE';

export type UserRole = 'buyer' | 'seller' | 'admin';

export type KYCLevel = 'none' | 'basic' | 'full';

export type KYCStatus = 'unverified' | 'pending' | 'verified';

export type ReputationEventType = 'positive' | 'neutral' | 'negative';

export type EvidenceKind = 'image' | 'chatlog' | 'other';

export interface DealTransition {
  from: DealStatus;
  to: DealStatus;
  reason?: string;
}
