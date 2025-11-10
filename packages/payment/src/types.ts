import type { Deal, PaymentProvider } from "@essy/core";

export interface CreateChargeRequest {
  deal: Deal;
  amountSatang: number;
  currency: string;
}

export interface CreateChargeResponse {
  qrString: string;
  providerRef: string;
  expiresAt?: Date;
}

export interface RefundRequest {
  paymentId: string;
  amountSatang: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  providerRef?: string;
}

export interface WebhookPayload {
  provider: PaymentProvider;
  event: string;
  data: Record<string, unknown>;
  signature?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}
