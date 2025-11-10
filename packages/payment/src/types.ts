export interface ChargeRequest {
  dealId: string;
  amountSatang: number;
  currency: string;
  description: string;
  metadata?: Record<string, unknown>;
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
  status: "SUCCESS" | "PENDING" | "FAILED";
  providerRef?: string;
}

export interface WebhookPayload {
  providerRef: string;
  status: "PAID" | "FAILED" | "REFUNDED";
  amountSatang: number;
  metadata?: Record<string, unknown>;
  signature?: string;
}
