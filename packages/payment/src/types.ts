import { DealStatus, PaymentStatus } from "@escrow/core";

export type PaymentProviderName = "mock_promptpay";

export type Money = {
  amountSatang: number;
  currency: "THB";
};

export type DealChargeInput = {
  dealId: string;
  title: string;
  sellerPromptPayId: string;
  buyerId?: string | null;
  paylinkToken: string;
  money: Money;
};

export type ChargeResponse = {
  qrString: string;
  providerRef: string;
  deepLink?: string;
};

export type RefundInput = {
  paymentId: string;
  providerRef: string;
  amount: Money;
};

export type RefundResponse = {
  status: PaymentStatus;
  message?: string;
};

export type WebhookVerificationInput = {
  payload: unknown;
  signature?: string;
  secret: string;
};

export type PaymentWebhookResult =
  | {
      action: "payment.succeeded";
      providerRef: string;
      status: PaymentStatus;
      raw: unknown;
    }
  | {
      action: "payment.failed";
      providerRef: string;
      status: PaymentStatus;
      raw: unknown;
    }
  | {
      action: "payment.refunded";
      providerRef: string;
      status: PaymentStatus;
      raw: unknown;
    };

export interface PaymentProvider {
  name: PaymentProviderName;
  createCharge(input: DealChargeInput): Promise<ChargeResponse>;
  refund(input: RefundInput): Promise<RefundResponse>;
  verifyWebhook(input: WebhookVerificationInput): PaymentWebhookResult;
  mapDealStatus?(webhook: PaymentWebhookResult): DealStatus | null;
}
