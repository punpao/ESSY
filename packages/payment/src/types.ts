import type { PaymentProvider } from "@essy/core";

export interface ChargeRequest {
  dealId: string;
  amountSatang: number;
  currency: string;
  description?: string;
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
  amountSatang: number;
}

export interface WebhookPayload {
  provider: PaymentProvider;
  event: string;
  data: Record<string, unknown>;
  signature?: string;
}
