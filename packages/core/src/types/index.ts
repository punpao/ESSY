export type UserRole = 'buyer' | 'seller' | 'admin';
export type KYCLevel = 'none' | 'basic' | 'full';
export type KYCStatus = 'unverified' | 'pending' | 'verified';

export type DealStatus = 'PENDING' | 'HOLD' | 'SHIPPED' | 'RELEASED' | 'DISPUTE' | 'REFUND';

export type PaymentStatus = 'INIT' | 'PAID' | 'REFUNDED' | 'FAILED';
export type PaymentProvider = 'mock_promptpay';

export type DisputeStatus = 'OPEN' | 'NEED_MORE_INFO' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE';

export type EvidenceKind = 'image' | 'chatlog' | 'other';

export type ReputationEventType = 'positive' | 'neutral' | 'negative';
