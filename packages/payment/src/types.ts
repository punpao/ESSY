export interface ChargeRequest {
  dealId: string;
  amountSatang: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ChargeResponse {
  qrString: string;
  providerRef: string;
  expiresAt?: Date;
}

export interface RefundRequest {
  paymentId: string;
  amountSatang?: number; // Partial refund if provided
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'SUCCESS' | 'FAILED';
  amountSatang: number;
}

export interface WebhookPayload {
  providerRef: string;
  status: 'PAID' | 'FAILED' | 'REFUNDED';
  amountSatang: number;
  timestamp: string;
  signature?: string;
}
