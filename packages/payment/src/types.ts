import { PaymentProviderType } from "@escrow/core";

export interface CreateChargeInput {
  dealId: string;
  amountSatang: number;
  currency: string;
  buyerEmail?: string | null;
  expiresAt: Date;
  metadata?: Record<string, string | number>;
}

export interface CreateChargeResult {
  qrString: string;
  providerRef: string;
  expiresAt: Date;
}

export interface RefundInput {
  paymentId: string;
  providerRef: string;
  amountSatang: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  message?: string;
}

export interface PaymentWebhookVerification<TPayload = unknown> {
  valid: boolean;
  event: "payment.paid" | "payment.refunded" | "payment.failed";
  payload: TPayload;
  providerRef: string;
}

export interface PaymentProvider<TWebhookPayload = unknown> {
  readonly type: PaymentProviderType;
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhook(
    rawBody: string,
    signature: string
  ): PaymentWebhookVerification<TWebhookPayload>;
}
