export type DealStatus =
  | 'PENDING'
  | 'HOLD'
  | 'SHIPPED'
  | 'RELEASED'
  | 'DISPUTE'
  | 'REFUND';

export type DisputeStatus = 'OPEN' | 'NEED_MORE_INFO' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE';

export type PaymentStatus = 'INIT' | 'PAID' | 'REFUNDED' | 'FAILED';

export const DEAL_STATUS_LABEL_TH: Record<DealStatus, string> = {
  PENDING: 'รอชำระ',
  HOLD: 'พักเงิน',
  SHIPPED: 'ร้านค้าจัดส่งแล้ว',
  RELEASED: 'โอนเงินให้ผู้ขายแล้ว',
  DISPUTE: 'มีปัญหา',
  REFUND: 'คืนเงิน'
};
