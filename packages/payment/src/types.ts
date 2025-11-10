export interface ChargeRequest {
  dealId: string;
  amountSatang: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
}

export interface ChargeResponse {
  qrString: string;
  providerRef: string;
  expiresAt?: Date;
}

export interface RefundRequest {
  paymentId: string;
  amountSatang?: number; // Partial refund if specified
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'success' | 'pending' | 'failed';
  amountSatang: number;
}

export interface WebhookPayload {
  providerRef: string;
  status: 'paid' | 'failed' | 'refunded';
  amountSatang: number;
  timestamp: string;
  signature?: string;
}
