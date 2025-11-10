export interface ChargeRequest {
  dealId: string;
  amountSatang: number;
  currency: string;
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
  status: "refunded" | "pending";
}

export interface WebhookPayload {
  provider: string;
  event: string;
  data: Record<string, unknown>;
  signature?: string;
}
