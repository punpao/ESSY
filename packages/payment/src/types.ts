import type { PaymentProvider } from '@essy/core';

export interface ChargeRequest {
  dealId: string;
  amountSatang: number;
  currency: string;
  description: string;
}

export interface ChargeResponse {
  qrString: string;
  providerRef: string;
  expiresAt: Date;
}

export interface RefundRequest {
  paymentId: string;
  amountSatang: number;
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  providerRef: string;
  status: 'success' | 'failed';
}

export interface WebhookPayload {
  provider: PaymentProvider;
  event: string;
  data: Record<string, unknown>;
  signature?: string;
}

export interface PaymentProviderInterface {
  createCharge(request: ChargeRequest): Promise<ChargeResponse>;
  refund(request: RefundRequest): Promise<RefundResponse>;
  verifyWebhook(payload: WebhookPayload, secret: string): boolean;
}
