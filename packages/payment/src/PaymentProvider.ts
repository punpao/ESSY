import type {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from "./types";

export interface IPaymentProvider {
  /**
   * Create a charge/payment request
   */
  createCharge(request: ChargeRequest): Promise<ChargeResponse>;

  /**
   * Process a refund
   */
  refund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: WebhookPayload): Promise<boolean>;

  /**
   * Parse webhook event
   */
  parseWebhook(payload: WebhookPayload): Promise<{
    event: string;
    paymentRef: string;
    status: "paid" | "failed" | "refunded";
    metadata?: Record<string, unknown>;
  }>;
}
