export interface PaymentDealInput {
  id: string;
  amountSatang: number;
  currency: string;
  title: string;
  sellerPromptpayId: string;
}

export interface ChargeResult {
  qrString: string;
  providerRef: string;
  expiresAt: Date;
}

export interface RefundResult {
  providerRef: string;
  refunded: boolean;
}

export interface WebhookVerificationInput {
  signature: string | null;
  payload: unknown;
  secret: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  providerRef?: string;
  status?: 'PAID' | 'FAILED';
}

export interface PaymentProvider {
  name: string;
  createCharge(deal: PaymentDealInput): Promise<ChargeResult>;
  refund(providerRef: string, amountSatang: number): Promise<RefundResult>;
  verifyWebhook(input: WebhookVerificationInput): Promise<WebhookVerificationResult>;
}
