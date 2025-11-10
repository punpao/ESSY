export interface ChargeRequest {
  dealId: string;
  amountSatang: number;
  currency: string;
  description: string;
  recipientPromptPayId: string;
}

export interface ChargeResponse {
  qrString: string;
  qrDataUrl?: string;
  providerRef: string;
  expiresAt: Date;
}

export interface RefundRequest {
  providerRef: string;
  amountSatang: number;
  reason: string;
}

export interface RefundResponse {
  refundRef: string;
  success: boolean;
}

export interface WebhookPayload {
  event: string;
  providerRef: string;
  status: string;
  paidAt?: string;
  signature?: string;
  [key: string]: any;
}

export abstract class PaymentProvider {
  abstract createCharge(request: ChargeRequest): Promise<ChargeResponse>;
  abstract refund(request: RefundRequest): Promise<RefundResponse>;
  abstract verifyWebhook(payload: WebhookPayload, secret: string): boolean;
}
