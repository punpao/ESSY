export type UserRole = 'buyer' | 'seller' | 'admin';
export type KYCLevel = 'none' | 'basic' | 'full';
export type KYCStatus = 'unverified' | 'pending' | 'verified';

export type DealStatus = 
  | 'PENDING' 
  | 'HOLD' 
  | 'SHIPPED' 
  | 'RELEASED' 
  | 'DISPUTE' 
  | 'REFUND'
  | 'CANCELLED';

export type PaymentStatus = 'INIT' | 'PAID' | 'REFUNDED' | 'FAILED';

export type DisputeStatus = 
  | 'OPEN' 
  | 'NEED_MORE_INFO' 
  | 'RESOLVED_REFUND' 
  | 'RESOLVED_RELEASE';

export type EvidenceKind = 'image' | 'chatlog' | 'other';

export type ReputationEventType = 'positive' | 'neutral' | 'negative';

export interface User {
  id: string;
  role: UserRole;
  line_sub?: string | null;
  email?: string | null;
  phone?: string | null;
  kyc_level: KYCLevel;
  display_name: string;
  created_at: Date;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  verified: boolean;
  promptpay_id: string;
  promptpay_name: string;
  reputation_score: number;
  kyc_status: KYCStatus;
}

export interface Deal {
  id: string;
  title: string;
  amount_satang: number;
  currency: string;
  seller_id: string;
  buyer_id?: string | null;
  status: DealStatus;
  paylink_token: string;
  expires_at: Date;
  tracking_number?: string | null;
  courier?: string | null;
  delivered_at?: Date | null;
  auto_release_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  deal_id: string;
  provider: string;
  provider_ref: string;
  status: PaymentStatus;
  paid_at?: Date | null;
  created_at: Date;
}

export interface Dispute {
  id: string;
  deal_id: string;
  opened_by: string;
  reason_text: string;
  status: DisputeStatus;
  resolution_note?: string | null;
  created_at: Date;
  resolved_at?: Date | null;
}

export const DEAL_STATUS_LABELS_TH: Record<DealStatus, string> = {
  PENDING: 'รอชำระเงิน',
  HOLD: 'พักเงินแล้ว',
  SHIPPED: 'จัดส่งแล้ว',
  RELEASED: 'โอนเงินให้ผู้ขายแล้ว',
  DISPUTE: 'กำลังพิจารณาข้อพิพาท',
  REFUND: 'คืนเงินแล้ว',
  CANCELLED: 'ยกเลิกแล้ว',
};

export const DISPUTE_REASONS_TH = [
  { value: 'not_received', label: 'ของยังไม่ถึง' },
  { value: 'not_as_described', label: 'ของไม่ตรงปก' },
  { value: 'other', label: 'อื่น ๆ' },
];
