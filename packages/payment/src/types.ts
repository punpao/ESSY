import { Deal } from '@escrow/core';

export interface CreateChargeRequest {
  deal: Deal;
  webhookUrl: string;
}

export interface CreateChargeResponse {
  qrString: string;
  providerRef: string;
  expiresAt: Date;
}

export interface RefundRequest {
  paymentId: string;
  providerRef: string;
  amount: number;
  reason: string;
}

export interface RefundResponse {
  success: boolean;
  refundRef: string;
}

export interface WebhookPayload {
  providerRef: string;
  status: 'paid' | 'failed';
  signature?: string;
  metadata?: Record<string, any>;
}

export interface PaymentProvider {
  name: string;
  
  /**
   * Create a charge for a deal
   */
  createCharge(request: CreateChargeRequest): Promise<CreateChargeResponse>;
  
  /**
   * Refund a payment
   */
  refund(request: RefundRequest): Promise<RefundResponse>;
  
  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: WebhookPayload, signature: string): boolean;
}
