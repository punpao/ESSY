import { DealStatus } from '@thai-escrow/core';

export interface PaymentChargeResult {
  qrString: string;
  providerRef: string;
}

export interface PaymentProvider {
  name: string;
  createCharge(input: {
    dealId: string;
    amountSatang: number;
    currency: 'THB';
    description: string;
  }): Promise<PaymentChargeResult>;
  refund(input: { paymentId: string; reason?: string }): Promise<void>;
  verifyWebhook(payload: unknown, secret?: string): Promise<{
    valid: boolean;
    dealId?: string;
    providerRef?: string;
    status?: 'PAID' | 'FAILED';
    amountSatang?: number;
  }>;
}

export interface PaymentWebhookResult {
  dealStatus: DealStatus;
  paymentStatus: 'PAID' | 'FAILED';
}
