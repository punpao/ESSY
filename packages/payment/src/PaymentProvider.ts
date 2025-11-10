import {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from "./types";

export interface PaymentProvider {
  /**
   * Create a payment charge (e.g., QR code)
   */
  createCharge(request: ChargeRequest): Promise<ChargeResponse>;

  /**
   * Process a refund
   */
  refund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Verify webhook signature (if applicable)
   */
  verifyWebhook(payload: unknown, signature?: string): boolean;

  /**
   * Parse webhook payload
   */
  parseWebhook(payload: unknown): WebhookPayload;
}
