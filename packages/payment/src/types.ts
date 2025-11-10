export interface ChargeRequest {
  amount_satang: number;
  currency: string;
  deal_id: string;
  return_url?: string;
}

export interface ChargeResponse {
  provider_ref: string;
  qr_string?: string;
  payment_url?: string;
  expires_at: Date;
}

export interface RefundRequest {
  provider_ref: string;
  amount_satang: number;
  reason?: string;
}

export interface RefundResponse {
  refund_ref: string;
  status: 'success' | 'pending' | 'failed';
}

export interface WebhookPayload {
  provider: string;
  provider_ref: string;
  event_type: 'payment.success' | 'payment.failed' | 'refund.success';
  amount_satang: number;
  paid_at?: string;
  [key: string]: any;
}
